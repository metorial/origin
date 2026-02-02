import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { generatePlainId } from '@lowerdeck/id';
import { Service } from '@lowerdeck/service';
import type { Actor, ScmProvider, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { getId } from '../id';
import { createGitHubAppClient } from '../lib/githubApp';

class scmAuthServiceImpl {
  async getAuthorizationUrl(i: {
    tenant: Tenant;
    actor: Actor;
    provider: 'github';
    redirectUrl: string;
  }) {
    let attempt = await db.scmInstallationAttempt.create({
      data: {
        redirectUrl: i.redirectUrl,
        state: generatePlainId(30),
        tenantOid: i.tenant.oid,
        ownerActorOid: i.actor.oid
      }
    });

    if (i.provider === 'github') {
      // GitHub Apps use installation authorization flow
      let url = new URL(
        `https://github.com/apps/${env.gh.SCM_GITHUB_APP_ID}/installations/select_target`
      );
      url.searchParams.set('state', attempt.state);
      return url.toString();
    }

    throw new ServiceError(
      badRequestError({
        message: 'Unsupported provider'
      })
    );
  }

  async handleInstallation(i: {
    provider: 'github';
    installationId: string;
    setupAction: string;
    state: string;
  }) {
    let attempt = await db.scmInstallationAttempt.findUnique({
      where: {
        state: i.state
      }
    });
    if (!attempt) {
      throw new ServiceError(
        badRequestError({
          message: 'Invalid state'
        })
      );
    }

    if (i.provider === 'github') {
      // Get installation details using GitHub App authentication
      let octokit = createGitHubAppClient();

      let installationRes = await octokit.request('GET /app/installations/{installation_id}', {
        installation_id: parseInt(i.installationId)
      });

      let installation = installationRes.data;
      let account = installation.account;

      if (!account) {
        throw new ServiceError(badRequestError({ message: 'Installation account not found' }));
      }

      // Handle both User and Organization types
      let accountType: 'user' | 'organization' =
        'type' in account && account.type === 'User' ? 'user' : 'organization';
      let accountLogin =
        'login' in account ? account.login : 'slug' in account ? account.slug : '';
      let accountName = account.name || accountLogin;
      let accountEmail = 'email' in account ? account.email : null;

      let data = {
        provider: i.provider,
        tenantOid: attempt.tenantOid,
        ownerActorOid: attempt.ownerActorOid,

        externalInstallationId: i.installationId,
        accountType: accountType as 'user' | 'organization',

        externalAccountId: account.id.toString(),
        externalAccountLogin: accountLogin,
        externalAccountName: accountName || null,
        externalAccountEmail: accountEmail || null,
        externalAccountImageUrl: account.avatar_url || null
      };

      return db.scmInstallation.upsert({
        where: {
          tenantOid_provider_externalAccountId: {
            tenantOid: attempt.tenantOid,
            provider: i.provider,
            externalAccountId: account.id.toString()
          }
        },
        update: data,
        create: {
          ...getId('scmInstallation'),
          ...data
        }
      });
    }

    throw new ServiceError(
      badRequestError({
        message: 'Unsupported provider'
      })
    );
  }

  async getMatchingInstallation(i: {
    tenant: Tenant;
    ownerActor: Actor;
    provider: ScmProvider;
  }) {
    let installation = await db.scmInstallation.findFirst({
      where: {
        tenantOid: i.tenant.oid,
        provider: i.provider,
        ownerActorOid: i.ownerActor.oid
      }
    });
    if (installation) return installation;

    installation = await db.scmInstallation.findFirst({
      where: {
        tenantOid: i.tenant.oid,
        provider: i.provider
      }
    });
    if (installation) return installation;

    throw new ServiceError(notFoundError('integrations.scm.installation'));
  }
}

export let scmAuthService = Service.create(
  'scmAuthService',
  () => new scmAuthServiceImpl()
).build();
