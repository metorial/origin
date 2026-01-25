import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';

export let createHandleRepoPushQueue = createQueue<{ pushId: string }>({
  name: 'ori/rep/hndl-push',
  redisUrl: env.service.REDIS_URL
});

export let createHandleRepoPushQueueProcessor = createHandleRepoPushQueue.process(
  async data => {
    let push = await db.scmRepositoryPush.findUnique({
      where: { id: data.pushId },
      include: { repo: true }
    });
    if (!push) throw new QueueRetryError();

    // TODO: add change notifications
  }
);
