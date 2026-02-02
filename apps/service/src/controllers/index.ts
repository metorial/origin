import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { actorController } from './actor';
import { changeNotificationController } from './changeNotification';
import { codeBucketController } from './codeBucket';
import { scmInstallationController } from './scmInstallation';
import { scmRepoPushController } from './scmRepoPush';
import { scmRepositoryController } from './scmRepository';
import { tenantController } from './tenant';

export let rootController = app.controller({
  tenant: tenantController,
  actor: actorController,
  codeBucket: codeBucketController,
  scmInstallation: scmInstallationController,
  scmRepository: scmRepositoryController,
  scmRepoPush: scmRepoPushController,
  changeNotification: changeNotificationController
});

export let OriginRPC = createServer({})(rootController);
export let originApi = apiMux([
  { endpoint: rpcMux({ path: '/metorial-origin' }, [OriginRPC]) }
]);

export type OriginClient = InferClient<typeof rootController>;
