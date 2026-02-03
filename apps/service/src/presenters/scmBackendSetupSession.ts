import type { ScmBackendSetupSession } from '../../prisma/generated/client';
import { env } from '../env';

export let presentScmBackendSetupSession = (session: ScmBackendSetupSession) => ({
  object: 'origin#scmBackendSetupSession',
  id: session.id,
  type: session.type,
  url: `${env.service.ORIGIN_SERVICE_PUBLIC_URL}/origin/scm/backend-setup/${session.id}`,
  parentInstallationSessionId: session.parentInstallationSessionOid
    ? session.parentInstallationSessionOid.toString()
    : null,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt
});
