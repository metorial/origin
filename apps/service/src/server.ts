import { OriginApi } from './controllers';

console.log('Server is running');

Bun.serve({
  fetch: OriginApi,
  port: 52050
});

await import('./worker');
