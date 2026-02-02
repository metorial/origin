import { createValidatedEnv } from '@lowerdeck/env';
import { v } from '@lowerdeck/validation';

export let env = createValidatedEnv({
  service: {
    REDIS_URL: v.string(),
    DATABASE_URL: v.string(),

    ORIGIN_SERVICE_URL: v.string()
  },

  codeBucket: {
    CODE_BUCKET_SERVICE_URL: v.string(),
    CODE_BUCKET_EDITOR_URL: v.string(),
    CODE_BUCKET_EDITOR_API_URL: v.string()
  },

  gh: {
    SCM_GITHUB_APP_ID: v.string(),
    SCM_GITHUB_APP_PRIVATE_KEY: v.string(),
    SCM_GITHUB_APP_CLIENT_ID: v.string(),
    SCM_GITHUB_APP_CLIENT_SECRET: v.string()
  }
});
