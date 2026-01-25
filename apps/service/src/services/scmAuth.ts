import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { generatePlainId } from '@lowerdeck/id';
import { Service } from '@lowerdeck/service';
import type { Actor, ScmProvider, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { getId } from '../id';

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
      let url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', env.gh.SCM_GITHUB_CLIENT_ID!);
      url.searchParams.set('scope', 'user:email read:org repo');
      url.searchParams.set('state', attempt.state);
      url.searchParams.set(
        'redirect_uri',
        `${env.service.ORIGIN_SERVICE_URL}/origin/scm/oauth/github/callback`
      );
      return url.toString();
    }

    throw new ServiceError(
      badRequestError({
        message: 'Unsupported provider'
      })
    );
  }

  async exchangeCodeForToken(i: { provider: 'github'; code: string; state: string }) {
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
      let tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.gh.SCM_GITHUB_CLIENT_ID,
          client_secret: env.gh.SCM_GITHUB_CLIENT_SECRET,
          code: i.code,
          redirect_uri: `${env.service.ORIGIN_SERVICE_URL}/origin/scm/oauth/github/callback`,
          state: i.state
        })
      });

      if (!tokenRes.ok) {
        throw new ServiceError(
          badRequestError({
            message: 'Failed to exchange code for token'
          })
        );
      }

      let tokenData: { access_token?: string; error?: string; error_description?: string } =
        (await tokenRes.json()) as any;

      if (tokenData.error || !tokenData.access_token) {
        throw new ServiceError(
          badRequestError({
            message: 'Failed to exchange code for token',
            hint: tokenData.error_description || tokenData.error
          })
        );
      }

      let profileRes = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      if (!profileRes.ok) {
        throw new ServiceError(
          badRequestError({
            message: 'Failed to fetch user profile from GitHub'
          })
        );
      }

      let profileData: {
        id: number;
        login: string;
        name: string;
        email?: string;

        avatar_url?: string;
      } = (await profileRes.json()) as any;

      if (!profileData.id || !profileData.login) {
        throw new ServiceError(
          badRequestError({
            message: 'Failed to fetch user profile from GitHub'
          })
        );
      }

      let data = {
        provider: i.provider,
        tenantOid: attempt.tenantOid,
        ownerActorOid: attempt.ownerActorOid,

        externalUserEmail: profileData.email,
        externalUserId: profileData.id.toString(),
        externalUserName: profileData.name ?? profileData.login,
        externalUserImageUrl: profileData.avatar_url,

        accessToken: tokenData.access_token
      };

      return db.scmInstallation.upsert({
        where: {
          tenantOid_provider_externalUserId: {
            tenantOid: attempt.tenantOid,
            provider: i.provider,
            externalUserId: profileData.id.toString()
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
