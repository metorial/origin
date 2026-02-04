import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';

class ChangeNotificationServiceImpl {
  async getChangeNotificationById(d: { tenant: Tenant; changeNotificationId: string }) {
    let notification = await db.changeNotification.findFirst({
      where: {
        id: d.changeNotificationId,
        tenantOid: d.tenant.oid
      },
      include: {
        repo: { include: { account: true } },
        repoPush: { include: { repo: true } }
      }
    });
    if (!notification)
      throw new ServiceError(notFoundError('change_notification', d.changeNotificationId));

    return notification;
  }

  async listChangeNotifications(d: { tenant: Tenant; repoId?: string }) {
    return Paginator.create(({ prisma }) =>
      prisma(async opts =>
        db.changeNotification.findMany({
          ...opts,
          where: {
            tenantOid: d.tenant.oid,
            ...(d.repoId && {
              repo: {
                id: d.repoId
              }
            })
          },
          include: {
            repo: { include: { account: true } },
            repoPush: { include: { repo: true } }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      )
    );
  }
}

export let changeNotificationService = Service.create(
  'changeNotificationService',
  () => new ChangeNotificationServiceImpl()
).build();
