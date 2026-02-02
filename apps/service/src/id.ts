import { createIdGenerator, idType } from '@lowerdeck/id';
import { Worker as SnowflakeId } from 'snowflake-uuid';

export let ID = createIdGenerator({
  tenant: idType.sorted('otn_'),
  actor: idType.sorted('oac_'),

  codeBucket: idType.sorted('ocb_'),
  codeBucketPurpose: idType.sorted('ocp_'),
  codeBucketTemplate: idType.sorted('oct_'),

  scmAccount: idType.sorted('osa_'),
  scmRepository: idType.sorted('osr_'),
  scmInstallation: idType.sorted('osi_'),
  scmInstallationAttempt: idType.sorted('osb_'),
  scmRepositoryWebhook: idType.sorted('osw_'),
  scmRepositoryReceivedEvent: idType.sorted('ose_'),
  scmRepositoryPush: idType.sorted('osp_')
});

let workerIdBits = 12;
let workerIdMask = (1 << workerIdBits) - 1;

let workerId = (() => {
  let array = new Uint16Array(1);
  crypto.getRandomValues(array);
  return array[0]! & workerIdMask;
})();

export let snowflake = new SnowflakeId(workerId, 0, {
  workerIdBits: workerIdBits,
  datacenterIdBits: 0,
  sequenceBits: 9,
  epoch: new Date('2025-06-01T00:00:00Z').getTime()
});

export let getId = <K extends Parameters<typeof ID.generateIdSync>[0]>(model: K) => ({
  oid: snowflake.nextId(),
  id: ID.generateIdSync(model)
});
