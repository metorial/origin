import type { ScmInstallationSession } from '../../prisma/generated/client';
import { env } from '../env';

export let presentScmInstallationSession = (session: ScmInstallationSession) => ({
  id: session.id,
  url: `${env.service.ORIGIN_SERVICE_PUBLIC_URL}/origin/scm/installation-session/${session.id}`,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt
});
