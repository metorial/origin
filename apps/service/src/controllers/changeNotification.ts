import { v } from '@lowerdeck/validation';
import { changeNotificationPresenter } from '../presenters/changeNotification';
import { changeNotificationService } from '../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let changeNotificationApp = tenantApp.use(async ctx => {
  let changeNotificationId = ctx.body.changeNotificationId;
  if (!changeNotificationId) throw new Error('Change Notification ID is required');

  let changeNotification = await changeNotificationService.getChangeNotificationById({
    tenant: ctx.tenant,
    changeNotificationId
  });

  return { changeNotification };
});

export let changeNotificationController = app.controller({
  list: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        repoId: v.optional(v.string())
      })
    )
    .do(async ctx => {
      let paginator = await changeNotificationService.listChangeNotifications({
        tenant: ctx.tenant,
        repoId: ctx.input.repoId
      });

      let notifications = await paginator.run({ limit: 100 });

      return {
        notifications: notifications.items.map(changeNotificationPresenter)
      };
    }),

  get: changeNotificationApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        changeNotificationId: v.string()
      })
    )
    .do(async ctx => changeNotificationPresenter(ctx.changeNotification))
});
