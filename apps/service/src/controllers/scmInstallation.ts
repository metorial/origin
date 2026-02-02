import { v } from '@lowerdeck/validation';
import { scmInstallationPresenter } from '../presenters/scmInstallation';
import { actorService, scmAuthService, scmInstallationService } from '../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let scmInstallationApp = tenantApp.use(async ctx => {
  let scmInstallationId = ctx.body.scmInstallationId;
  if (!scmInstallationId) throw new Error('SCM Installation ID is required');

  let scmInstallation = await scmInstallationService.getScmInstallationById({
    tenant: ctx.tenant,
    scmInstallationId
  });

  return { scmInstallation };
});

export let scmInstallationController = app.controller({
  getAuthorizationUrl: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        actorId: v.string(),
        provider: v.enumOf(['github']),
        redirectUrl: v.string()
      })
    )
    .do(async ctx => {
      let actor = await actorService.getActorById({ id: ctx.input.actorId });

      let url = await scmAuthService.getAuthorizationUrl({
        tenant: ctx.tenant,
        actor,
        provider: ctx.input.provider,
        redirectUrl: ctx.input.redirectUrl
      });

      return { url };
    }),

  list: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        actorId: v.string()
      })
    )
    .do(async ctx => {
      let actor = await actorService.getActorById({ id: ctx.input.actorId });

      let paginator = await scmInstallationService.listScmInstallations({
        tenant: ctx.tenant,
        actor
      });

      let installations = await paginator.run({ limit: 100 });

      return {
        installations: installations.items.map(scmInstallationPresenter)
      };
    }),

  get: scmInstallationApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        scmInstallationId: v.string()
      })
    )
    .do(async ctx => scmInstallationPresenter(ctx.scmInstallation))
});
