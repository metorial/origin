import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { actorController } from './actor';
import { tenantController } from './tenant';

export let rootController = app.controller({
  tenant: tenantController,
  actor: actorController
});

export let OriginRPC = createServer({})(rootController);
export let OriginApi = apiMux([
  { endpoint: rpcMux({ path: '/metorial-origin' }, [OriginRPC]) }
]);

export type OriginClient = InferClient<typeof rootController>;
