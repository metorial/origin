import { OriginApi } from './controllers';

console.log('Origin controller is running');

Bun.serve({
  fetch: OriginApi,
  port: 52090
});

await import('./worker');
