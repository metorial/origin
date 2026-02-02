import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { generatePlainId } from '@lowerdeck/id';
import { Service } from '@lowerdeck/service';
import type { Actor, ScmBackend, ScmProvider, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { getId } from '../id';
import { createGitHubAppClient } from '../lib/githubApp';
import { createGitLabClientWithToken, exchangeGitLabOAuthCode, getGitLabOAuthUrl } from '../lib/gitlab';

class scmAuthServiceImpl {
  async getAuthorizationUrl(i: {
    tenant: Tenant;
    actor: Actor;
    provider: 'github' | 'gitlab';
    backendId: string;
    redirectUrl: string;
  }) {
    let backend = await db.scmBackend.findFirst({
      where: {
        id: i.backendId,
        OR: [{ tenantOid: i.tenant.oid }, { tenantOid: null }]
      }
    });

    if (!backend) {
      throw new ServiceError(notFoundError('scmBackend'));
    }

    let attempt = await db.scmInstallationAttempt.create({
      data: {
        redirectUrl: i.redirectUrl,
        state: generatePlainId(30),
        tenantOid: i.tenant.oid,
        backendOid: backend.oid,
        ownerActorOid: i.actor.oid
      }
    });

    if (i.provider === 'github' && backend.type === 'github') {
      // GitHub Apps use installation authorization flow
      let webUrl = backend.webUrl;
      let appId = backend.appId;
      let url = new URL(`${webUrl}/apps/${appId}/installations/select_target`);
      url.searchParams.set('state', attempt.state);
      return url.toString();
    }

    if (i.provider === 'github' && backend.type === 'github_enterprise') {
      // GitHub Enterprise Apps use installation authorization flow
      let webUrl = backend.webUrl;
      let appId = backend.appId;
      let url = new URL(`${webUrl}/apps/${appId}/installations/select_target`);
      url.searchParams.set('state', attempt.state);
      return url.toString();
    }

    if (i.provider === 'gitlab' && (backend.type === 'gitlab' || backend.type === 'gitlab_selfhosted')) {
      // GitLab OAuth authorization flow
      return getGitLabOAuthUrl({
        backend,
        redirectUri: `${env.service.ORIGIN_SERVICE_URL}/origin/oauth/gitlab/callback`,
        state: attempt.state
      });
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
      },
      include: {
        backend: true
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
      let octokit = createGitHubAppClient(attempt.backend);

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
        backendOid: attempt.backendOid,
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
          tenantOid_provider_backendOid_externalAccountId: {
            tenantOid: attempt.tenantOid,
            provider: i.provider,
            backendOid: attempt.backendOid,
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

  async handleGitLabOAuthCallback(i: {
    provider: 'gitlab';
    code: string;
    state: string;
  }) {
    let attempt = await db.scmInstallationAttempt.findUnique({
      where: {
        state: i.state
      },
      include: {
        backend: true
      }
    });
    if (!attempt) {
      throw new ServiceError(
        badRequestError({
          message: 'Invalid state'
        })
      );
    }

    if (i.provider === 'gitlab') {
      // Exchange code for tokens
      let { accessToken, refreshToken } = await exchangeGitLabOAuthCode({
        backend: attempt.backend,
        code: i.code,
        redirectUri: `${env.service.ORIGIN_SERVICE_URL}/origin/oauth/gitlab/callback`
      });

      // Get user info
      let gitlab = createGitLabClientWithToken(accessToken, attempt.backend);
      let user = await gitlab.Users.showCurrentUser();

      let data = {
        provider: i.provider,
        tenantOid: attempt.tenantOid,
        backendOid: attempt.backendOid,
        ownerActorOid: attempt.ownerActorOid,

        accessToken,
        refreshToken,
        accountType: 'user' as const,

        externalAccountId: user.id.toString(),
        externalAccountLogin: user.username,
        externalAccountName: user.name || user.username,
        externalAccountEmail: user.email || null,
        externalAccountImageUrl: user.avatar_url || null
      };

      return db.scmInstallation.upsert({
        where: {
          tenantOid_provider_backendOid_externalAccountId: {
            tenantOid: attempt.tenantOid,
            provider: i.provider,
            backendOid: attempt.backendOid,
            externalAccountId: user.id.toString()
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
