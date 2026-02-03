import { generatePlainId } from '@lowerdeck/id';
import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';
import { ID } from '../../id';
import { createGitHubInstallationClient } from '../../lib/githubApp';
import { createGitLabClientWithToken } from '../../lib/gitlab';

export let createRepoWebhookQueue = createQueue<{ repoId: string }>({
  name: 'ori/rep/wh-cr',
  redisUrl: env.service.REDIS_URL
});

export let createRepoWebhookQueueProcessor = createRepoWebhookQueue.process(async data => {
  let repo = await db.scmRepository.findUnique({
    where: { id: data.repoId },
    include: { installation: { include: { backend: true } } }
  });
  if (!repo) throw new QueueRetryError();

  let secret = generatePlainId(32);
  let webhookId = await ID.generateId('scmRepositoryWebhook');

  let existingWebhook = await db.scmRepositoryWebhook.findUnique({
    where: { repoOid: repo.oid }
  });
  if (existingWebhook) return;

  if (repo.provider === 'github') {
    if (!repo.installation.externalInstallationId) {
      throw new Error('Installation ID not found');
    }

    let octokit = await createGitHubInstallationClient(
      repo.installation.externalInstallationId,
      repo.installation.backend
    );

    let whRes = await octokit.request('POST /repos/{owner}/{repo}/hooks', {
      owner: repo.externalOwner,
      repo: repo.externalName,
      config: {
        url: `${env.service.ORIGIN_SERVICE_PUBLIC_URL}/origin/scm/webhook-ingest/gh/${webhookId}`,
        content_type: 'json',
        secret,
        insecure_ssl: '0'
      },
      events: ['push'],
      active: true
    });

    await db.scmRepositoryWebhook.upsert({
      where: {
        repoOid: repo.oid
      },
      create: {
        id: webhookId,
        repoOid: repo.oid,
        externalId: whRes.data.id.toString(),
        signingSecret: secret,
        type: 'push'
      },
      update: {}
    });
  }

  if (repo.provider === 'gitlab') {
    if (!repo.installation.accessToken) {
      throw new Error('Access token not found');
    }

    let gitlab = createGitLabClientWithToken(
      repo.installation.accessToken,
      repo.installation.backend
    );

    let hook = await gitlab.ProjectHooks.add(
      parseInt(repo.externalId),
      `${env.service.ORIGIN_SERVICE_PUBLIC_URL}/origin/scm/webhook-ingest/gl/${webhookId}`,
      {
        pushEvents: true,
        token: secret
      }
    );

    await db.scmRepositoryWebhook.upsert({
      where: {
        repoOid: repo.oid
      },
      create: {
        id: webhookId,
        repoOid: repo.oid,
        externalId: hook.id.toString(),
        signingSecret: secret,
        type: 'push'
      },
      update: {}
    });
  }
});
