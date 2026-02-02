import type { ScmRepository } from '../../prisma/generated/client';

export let repositoryPresenter = (repository: ScmRepository) => ({
  object: 'origin#repository',

  id: repository.id,
  identifier: repository.identifier,
  name: repository.name,

  provider: repository.provider,
  externalId: repository.externalId,
  externalOwner: repository.externalOwner,
  externalName: repository.externalName,

  defaultBranch: repository.defaultBranch,

  createdAt: repository.createdAt,
  updatedAt: repository.updatedAt
});
