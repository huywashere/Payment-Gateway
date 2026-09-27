import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, PORTAL_SESSION_COOKIE, portalAuthMode, portalMode, securePortalCookies } from '@/lib/portal-auth';
import {
  discoverOidc, OIDC_NONCE_COOKIE, OIDC_RETURN_COOKIE, OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE, requiredOidcConfig, roleFromClaims, safeReturnTo, verifyIdToken,
} from '@/lib/portal-oidc';

export async function GET(request: NextRequest) {
  if (portalAuthMode() !== 'oidc') return NextResponse.json({ error: 'OIDC is disabled' }, { status: 404 });
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(OIDC_STATE_COOKIE)?.value;
  const nonce = request.cookies.get(OIDC_NONCE_COOKIE)?.value;
  const verifier = request.cookies.get(OIDC_VERIFIER_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState || !nonce || !verifier) {
    return NextResponse.json({ error: 'OIDC callback state is invalid or expired' }, { status: 400 });
  }

  const discovery = await discoverOidc();
  const { clientId, clientSecret } = requiredOidcConfig();
  const callback = new URL('/api/auth/oidc/callback', request.url).toString();
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callback, code_verifier: verifier }),
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  });
  if (!tokenResponse.ok) return NextResponse.json({ error: 'OIDC token exchange failed' }, { status: 401 });
  const tokens = await tokenResponse.json() as { id_token?: string };
  if (!tokens.id_token) return NextResponse.json({ error: 'OIDC provider returned no ID token' }, { status: 401 });
  const claims = await verifyIdToken(tokens.id_token, discovery, nonce);
  const email = typeof claims.email === 'string' ? claims.email : '';
  if (!email || !claims.sub) return NextResponse.json({ error: 'OIDC identity is missing email or subject' }, { status: 403 });
  const role = roleFromClaims(claims);
  const token = await createPortalSession({
    email, subject: claims.sub, role, authMethod: 'oidc',
    merchantId: typeof claims.merchant_id === 'string'
      ? claims.merchant_id : process.env.PORTAL_OIDC_DEFAULT_MERCHANT_ID || '',
    environment: portalMode(),
  });
  if (!process.env.PORTAL_OIDC_DEFAULT_MERCHANT_ID && typeof claims.merchant_id !== 'string') {
    return NextResponse.json({ error: 'OIDC identity has no merchant assignment' }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL(safeReturnTo(request.cookies.get(OIDC_RETURN_COOKIE)?.value || null), request.url));
  response.cookies.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true, secure: securePortalCookies(), sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60,
  });
  for (const name of [OIDC_STATE_COOKIE, OIDC_NONCE_COOKIE, OIDC_VERIFIER_COOKIE, OIDC_RETURN_COOKIE]) {
    response.cookies.set(name, '', { httpOnly: true, path: '/', maxAge: 0 });
  }
  return response;
}
