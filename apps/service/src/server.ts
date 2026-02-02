import { originApi } from './controllers';
import { scmController } from './public/scm';

console.log('Origin controller is running');

Bun.serve({
  fetch: originApi,
  port: 52090
});

Bun.serve({
  fetch: scmController.fetch,
  port: 52093
});

await import('./worker');
