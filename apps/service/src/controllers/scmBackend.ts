import { v } from '@lowerdeck/validation';
import { scmBackendPresenter } from '../presenters/scmBackend';
import { scmBackendService } from '../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let scmBackendApp = tenantApp.use(async ctx => {
  let backendId = ctx.body.backendId;
  if (!backendId) throw new Error('Backend ID is required');

  let backend = await scmBackendService.getScmBackendById({
    backendId,
    tenant: ctx.tenant
  });

  return { backend };
});

export let scmBackendController = app.controller({
  list: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string()
      })
    )
    .do(async ctx => {
      let backends = await scmBackendService.listScmBackends({
        tenant: ctx.tenant
      });

      return {
        backends: backends.map(scmBackendPresenter)
      };
    }),

  get: scmBackendApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        backendId: v.string()
      })
    )
    .do(async ctx => scmBackendPresenter(ctx.backend)),

  create: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        type: v.enumOf(['github_enterprise']),
        name: v.string(),
        description: v.optional(v.string()),
        apiUrl: v.string(),
        webUrl: v.string(),
        appId: v.string(),
        appPrivateKey: v.string(),
        clientId: v.string(),
        clientSecret: v.string()
      })
    )
    .do(async ctx => {
      let backend = await scmBackendService.createScmBackend({
        tenant: ctx.tenant,
        type: ctx.input.type,
        name: ctx.input.name,
        description: ctx.input.description,
        apiUrl: ctx.input.apiUrl,
        webUrl: ctx.input.webUrl,
        appId: ctx.input.appId,
        appPrivateKey: ctx.input.appPrivateKey,
        clientId: ctx.input.clientId,
        clientSecret: ctx.input.clientSecret
      });

      return scmBackendPresenter(backend);
    }),

  update: scmBackendApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        backendId: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        appId: v.optional(v.string()),
        appPrivateKey: v.optional(v.string()),
        clientId: v.optional(v.string()),
        clientSecret: v.optional(v.string())
      })
    )
    .do(async ctx => {
      let backend = await scmBackendService.updateScmBackend({
        backend: ctx.backend,
        name: ctx.input.name,
        description: ctx.input.description,
        appId: ctx.input.appId,
        appPrivateKey: ctx.input.appPrivateKey,
        clientId: ctx.input.clientId,
        clientSecret: ctx.input.clientSecret
      });

      return scmBackendPresenter(backend);
    }),

  delete: scmBackendApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        backendId: v.string()
      })
    )
    .do(async ctx => {
      await scmBackendService.deleteScmBackend({
        backend: ctx.backend
      });

      return { success: true };
    })
});
