import type { Sender } from '../../prisma/generated/client';

export let senderPresenter = (sender: Sender) => ({
  object: 'origin#sender',

  id: sender.id,
  identifier: sender.identifier,
  name: sender.name,

  createdAt: sender.createdAt
});
