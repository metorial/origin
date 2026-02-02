import { originApi } from './controllers';
import { scmController } from './public/scm';
import { scmBackendService } from './services';

console.log('Origin controller is running');

// Initialize default backends
await scmBackendService.ensureDefaultBackends();

Bun.serve({
  fetch: originApi,
  port: 52090
});

Bun.serve({
  fetch: scmController.fetch,
  port: 52093
});

await import('./worker');
