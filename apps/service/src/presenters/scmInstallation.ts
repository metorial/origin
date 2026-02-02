import type { ScmInstallation } from '../../prisma/generated/client';

export let scmInstallationPresenter = (installation: ScmInstallation) => ({
  object: 'origin#scm_installation',

  id: installation.id,
  provider: installation.provider,

  externalUserId: installation.externalUserId,
  externalUserName: installation.externalUserName,
  externalUserEmail: installation.externalUserEmail,
  externalUserImageUrl: installation.externalUserImageUrl,

  createdAt: installation.createdAt,
  updatedAt: installation.updatedAt
});
