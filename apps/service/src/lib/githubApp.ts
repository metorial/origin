import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';
import { env } from '../env';

export let createGitHubAppClient = () => {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.gh.SCM_GITHUB_APP_ID,
      privateKey: env.gh.SCM_GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });
};

export let createGitHubInstallationClient = async (installationId: string) => {
  let octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.gh.SCM_GITHUB_APP_ID,
      privateKey: env.gh.SCM_GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
      installationId: parseInt(installationId)
    }
  });

  return octokit;
};

export let getInstallationAccessToken = async (installationId: string): Promise<string> => {
  let octokit = createGitHubAppClient();

  let response = await octokit.request(
    'POST /app/installations/{installation_id}/access_tokens',
    {
      installation_id: parseInt(installationId)
    }
  );

  return response.data.token;
};
