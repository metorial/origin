import { generatePlainId } from '@lowerdeck/id';
import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';
import { ID } from '../../id';
import { createGitHubInstallationClient } from '../../lib/githubApp';

export let createRepoWebhookQueue = createQueue<{ repoId: string }>({
  name: 'ori/rep/wh-cr',
  redisUrl: env.service.REDIS_URL
});

export let createRepoWebhookQueueProcessor = createRepoWebhookQueue.process(async data => {
  let repo = await db.scmRepository.findUnique({
    where: { id: data.repoId },
    include: { installation: true }
  });
  if (!repo) throw new QueueRetryError();
  if (!repo.installation.externalInstallationId) {
    throw new Error('Installation ID not found');
  }

  let octokit = await createGitHubInstallationClient(repo.installation.externalInstallationId);

  let secret = generatePlainId(32);
  let webhookId = await ID.generateId('scmRepositoryWebhook');

  let existingWebhook = await db.scmRepositoryWebhook.findUnique({
    where: { repoOid: repo.oid }
  });
  if (existingWebhook) return;

  let whRes = await octokit.request('POST /repos/{owner}/{repo}/hooks', {
    owner: repo.externalOwner,
    repo: repo.externalName,
    config: {
      url: `${env.service.ORIGIN_SERVICE_URL}/origin/scm/webhook-ingest/gh/${webhookId}`,
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
});
