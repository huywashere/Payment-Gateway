import { NextResponse } from 'next/server';
import { portalAuthMode, securePortalCookies } from '@/lib/portal-auth';
import {
  discoverOidc, OIDC_NONCE_COOKIE, OIDC_RETURN_COOKIE, OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE, pkceChallenge, randomBase64Url, requiredOidcConfig, safeReturnTo,
} from '@/lib/portal-oidc';

export async function GET(request: Request) {
  if (portalAuthMode() !== 'oidc') return NextResponse.json({ error: 'OIDC is disabled' }, { status: 404 });
  const discovery = await discoverOidc();
  const { clientId } = requiredOidcConfig();
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const verifier = randomBase64Url(48);
  const callback = new URL('/api/auth/oidc/callback', request.url).toString();
  const authorization = new URL(discovery.authorization_endpoint);
  authorization.searchParams.set('client_id', clientId);
  authorization.searchParams.set('redirect_uri', callback);
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', 'openid profile email');
  authorization.searchParams.set('state', state);
  authorization.searchParams.set('nonce', nonce);
  authorization.searchParams.set('code_challenge', await pkceChallenge(verifier));
  authorization.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorization);
  const options = { httpOnly: true, secure: securePortalCookies(), sameSite: 'lax' as const, maxAge: 600 };
  response.cookies.set(OIDC_STATE_COOKIE, state, options);
  response.cookies.set(OIDC_NONCE_COOKIE, nonce, options);
  response.cookies.set(OIDC_VERIFIER_COOKIE, verifier, options);
  response.cookies.set(OIDC_RETURN_COOKIE, safeReturnTo(new URL(request.url).searchParams.get('returnTo')), options);
  return response;
}
