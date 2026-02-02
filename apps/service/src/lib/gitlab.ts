import { Gitlab } from '@gitbeaker/rest';
import { badRequestError, ServiceError } from '@lowerdeck/error';
import type { ScmBackend } from '../../prisma/generated/client';

export let createGitLabClient = (backend?: ScmBackend) => {
  let host = backend?.apiUrl ?? 'https://gitlab.com';
  let oauthToken = undefined; // Will be set when we have a token

  return new Gitlab({
    host,
    oauthToken
  });
};

export let createGitLabClientWithToken = (token: string, backend?: ScmBackend) => {
  let host = backend?.apiUrl ?? 'https://gitlab.com';

  return new Gitlab({
    host,
    oauthToken: token
  });
};

export let getGitLabOAuthUrl = (i: {
  backend: ScmBackend;
  redirectUri: string;
  state: string;
}) => {
  let webUrl = i.backend.webUrl;
  let clientId = i.backend.clientId;

  let url = new URL(`${webUrl}/oauth/authorize`);
  url.searchParams.set('client_id', clientId!);
  url.searchParams.set('redirect_uri', i.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', i.state);
  url.searchParams.set('scope', 'api read_user read_repository write_repository');

  return url.toString();
};

export let exchangeGitLabOAuthCode = async (i: {
  backend: ScmBackend;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; refreshToken: string }> => {
  let webUrl = i.backend.webUrl;
  let clientId = i.backend.clientId;
  let clientSecret = i.backend.clientSecret;

  let response = await fetch(`${webUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: i.code,
      grant_type: 'authorization_code',
      redirect_uri: i.redirectUri
    })
  });

  if (!response.ok) {
    throw new ServiceError(
      badRequestError({
        message: `GitLab OAuth token exchange failed: ${response.statusText}`
      })
    );
  }

  let data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token
  };
};
