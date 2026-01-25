import { combineQueueProcessors } from '@lowerdeck/queue';
import { cloneBucketQueueProcessor } from './cloneBucket';
import { copyFromToBucketQueueProcessor } from './copyFromToBucket';
import { exportGithubQueueProcessor } from './exportGithub';
import { importGithubQueueProcessor } from './importGithub';
import { importTemplateQueueProcessor } from './importTemplate';

export let codeBucketQueueProcessor = combineQueueProcessors([
  cloneBucketQueueProcessor,
  importGithubQueueProcessor,
  exportGithubQueueProcessor,
  importTemplateQueueProcessor,
  copyFromToBucketQueueProcessor
]);
