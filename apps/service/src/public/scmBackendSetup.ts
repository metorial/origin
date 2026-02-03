import { createHono, useValidatedBody } from '@lowerdeck/hono';
import { v } from '@lowerdeck/validation';
import { db } from '../db';
import { backendSetupHtml } from '../lib/templates/backendSetup';
import { completeDashboardHtml } from '../lib/templates/completeDashboard';
import { scmBackendService, scmInstallationSessionService } from '../services';

export let scmBackendSetupPublicController = createHono()
  .get('/origin/scm/installation-session/:sessionId/setup-backend', async c => {
    let sessionId = c.req.param('sessionId');

    let session = await scmInstallationSessionService.getInstallationSessionPublic({
      sessionId
    });

    let tenant = await db.tenant.findUniqueOrThrow({ where: { oid: session.tenantOid } });
    let actor = await db.actor.findUniqueOrThrow({ where: { oid: session.ownerActorOid } });

    let setupSession = await scmInstallationSessionService.createBackendSetupSession({
      tenant,
      actor,
      type: 'github_enterprise',
      parentInstallationSession: session
    });

    return c.html(
      backendSetupHtml({
        sessionId: setupSession.id,
        installationSessionId: session.id
      })
    );
  })
  .post('/origin/scm/backend-setup/:sessionId/complete', async c => {
    let sessionId = c.req.param('sessionId');

    let body = await useValidatedBody(
      c,
      v.object({
        type: v.union([v.literal('github_enterprise'), v.literal('gitlab_selfhosted')]),
        name: v.string(),
        webUrl: v.string(),
        apiUrl: v.string(),
        clientId: v.string(),
        clientSecret: v.string(),
        appId: v.optional(v.string()),
        appPrivateKey: v.optional(v.string())
      })
    );

    let setupSession = await scmInstallationSessionService.getBackendSetupSessionPublic({
      sessionId
    });

    let tenant = await db.tenant.findUniqueOrThrow({ where: { oid: setupSession.tenantOid } });

    let backend = await scmBackendService.createScmBackend({
      tenant,
      type: body.type,
      name: body.name,
      description: undefined,
      webUrl: body.webUrl,
      apiUrl: body.apiUrl,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      appId: body.appId,
      appPrivateKey: body.appPrivateKey
    });

    await scmInstallationSessionService.completeBackendSetupSession({
      sessionId,
      backend
    });

    if (setupSession.parentInstallationSession) {
      return c.json({
        redirectUrl: `/origin/scm/installation-session/${setupSession.parentInstallationSession.id}`
      });
    }

    return c.html(completeDashboardHtml());
  });
