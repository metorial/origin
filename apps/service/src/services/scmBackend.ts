import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Service } from '@lowerdeck/service';
import type { ScmBackend, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { getId } from '../id';

class scmBackendServiceImpl {
  async ensureDefaultBackends() {
    // Ensure default GitHub.com backend exists
    await db.scmBackend.upsert({
      where: {
        tenantOid_type_apiUrl: {
          tenantOid: null as any, // Global backend
          type: 'github',
          apiUrl: 'https://api.github.com'
        }
      },
      create: {
        ...getId('scmBackend'),
        type: 'github',
        name: 'GitHub',
        description: 'GitHub.com',
        apiUrl: 'https://api.github.com',
        webUrl: 'https://github.com',
        appId: env.gh.SCM_GITHUB_APP_ID,
        appPrivateKey: env.gh.SCM_GITHUB_APP_PRIVATE_KEY,
        clientId: env.gh.SCM_GITHUB_APP_CLIENT_ID,
        clientSecret: env.gh.SCM_GITHUB_APP_CLIENT_SECRET,
        isDefault: true
      },
      update: {
        appId: env.gh.SCM_GITHUB_APP_ID,
        appPrivateKey: env.gh.SCM_GITHUB_APP_PRIVATE_KEY,
        clientId: env.gh.SCM_GITHUB_APP_CLIENT_ID,
        clientSecret: env.gh.SCM_GITHUB_APP_CLIENT_SECRET
      }
    });
  }

  async getDefaultGithubBackend(): Promise<ScmBackend> {
    await this.ensureDefaultBackends();

    let backend = await db.scmBackend.findFirst({
      where: {
        type: 'github',
        apiUrl: 'https://api.github.com',
        isDefault: true
      }
    });

    if (!backend) {
      throw new ServiceError(notFoundError('scmBackend'));
    }

    return backend;
  }

  async getScmBackendById(d: { tenant: Tenant; backendId: string }) {
    let backend = await db.scmBackend.findFirst({
      where: {
        id: d.backendId,
        OR: [{ tenantOid: d.tenant.oid }, { tenantOid: null }]
      }
    });

    if (!backend) {
      throw new ServiceError(notFoundError('scmBackend'));
    }

    return backend;
  }

  async listScmBackends(d: { tenant: Tenant }) {
    return db.scmBackend.findMany({
      where: {
        OR: [{ tenantOid: d.tenant.oid }, { tenantOid: null }]
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    });
  }

  async createScmBackend(d: {
    tenant: Tenant;
    type: 'github' | 'github_enterprise';
    name: string;
    description?: string;
    apiUrl: string;
    webUrl: string;
    appId: string;
    appPrivateKey: string;
    clientId: string;
    clientSecret: string;
  }) {
    // Validate URLs
    try {
      new URL(d.apiUrl);
      new URL(d.webUrl);
    } catch {
      throw new ServiceError(
        badRequestError({
          message: 'Invalid URL format'
        })
      );
    }

    return db.scmBackend.create({
      data: {
        ...getId('scmBackend'),
        tenantOid: d.tenant.oid,
        type: d.type,
        name: d.name,
        description: d.description,
        apiUrl: d.apiUrl,
        webUrl: d.webUrl,
        appId: d.appId,
        appPrivateKey: d.appPrivateKey,
        clientId: d.clientId,
        clientSecret: d.clientSecret,
        isDefault: false
      }
    });
  }

  async updateScmBackend(d: {
    backend: ScmBackend;
    name?: string;
    description?: string;
    appId?: string;
    appPrivateKey?: string;
    clientId?: string;
    clientSecret?: string;
  }) {
    if (d.backend.isDefault) {
      throw new ServiceError(
        badRequestError({
          message: 'Cannot update default backend'
        })
      );
    }

    return db.scmBackend.update({
      where: { oid: d.backend.oid },
      data: {
        name: d.name,
        description: d.description,
        appId: d.appId,
        appPrivateKey: d.appPrivateKey,
        clientId: d.clientId,
        clientSecret: d.clientSecret
      }
    });
  }

  async deleteScmBackend(d: { backend: ScmBackend }) {
    if (d.backend.isDefault) {
      throw new ServiceError(
        badRequestError({
          message: 'Cannot delete default backend'
        })
      );
    }

    await db.scmBackend.delete({
      where: { oid: d.backend.oid }
    });
  }
}

export let scmBackendService = Service.create(
  'scmBackendService',
  () => new scmBackendServiceImpl()
).build();
