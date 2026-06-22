import type { Env } from './env';

export interface AccessIdentity {
  email: string;
  userId?: string;
}

const EMAIL_HEADER = 'Cf-Access-Authenticated-User-Email';
const USER_ID_HEADER = 'Cf-Access-Authenticated-User-Id';

export function getAccessIdentity(request: Request, env: Env): AccessIdentity | null {
  const email = request.headers.get(EMAIL_HEADER);
  const userId = request.headers.get(USER_ID_HEADER) || undefined;

  if (email) {
    return { email, userId };
  }

  if (env.DISABLE_ACCESS_IDENTITY_CHECK === 'true') {
    return { email: 'local-dev@example.com' };
  }

  return null;
}

export function requireAccessIdentity(request: Request, env: Env): AccessIdentity | Response {
  const identity = getAccessIdentity(request, env);

  if (identity) {
    return identity;
  }

  return new Response('Company sign-in is required to use this site.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
