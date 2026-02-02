import { createHono, useValidatedQuery } from '@lowerdeck/hono';
import { v } from '@lowerdeck/validation';
import { completeDashboardHtml } from '../lib/templates/completeDashboard';
import { scmAuthService, scmRepoService } from '../services';

export let scmController = createHono()
  .get('/origin/oauth/github/callback', async c => {
    let query = await useValidatedQuery(
      c,
      v.object({
        installation_id: v.string(),
        setup_action: v.string(),
        state: v.string()
      })
    );

    await scmAuthService.handleInstallation({
      installationId: query.installation_id,
      setupAction: query.setup_action,
      state: query.state,
      provider: 'github'
    });

    return c.html(completeDashboardHtml());
  })
  .post('/origin/webhook-ingest/gh/:webhookId', async c => {
    let webhookId = c.req.param('webhookId');

    let eventType = c.req.header('X-GitHub-Event');
    let signature = c.req.header('X-Hub-signature-256');
    let idempotencyKey = c.req.header('X-GitHub-Delivery');

    if (!eventType || !signature || !idempotencyKey) {
      return c.text('Missing params', 400);
    }

    await scmRepoService.receiveWebhookEvent({
      idempotencyKey,
      eventType,
      signature,
      webhookId,
      payload: await c.req.text()
    });
  });
