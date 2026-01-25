import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { eventController } from './event';
import { eventDeliveryAttemptController } from './eventDeliveryAttempt';
import { eventDeliveryIntentController } from './eventDeliveryIntent';
import { eventDestinationController } from './eventDestination';
import { senderController } from './sender';
import { tenantController } from './tenant';

export let rootController = app.controller({
  tenant: tenantController,
  sender: senderController,
  event: eventController,
  eventDestination: eventDestinationController,
  eventDeliveryAttempt: eventDeliveryAttemptController,
  eventDeliveryIntent: eventDeliveryIntentController
});

export let OriginRPC = createServer({})(rootController);
export let OriginApi = apiMux([
  { endpoint: rpcMux({ path: '/metorial-origin' }, [OriginRPC]) }
]);

export type OriginClient = InferClient<typeof rootController>;
