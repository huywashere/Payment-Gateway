import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { PortalRole } from '@/lib/portal-auth';

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  issuer: string;
};

export const OIDC_STATE_COOKIE = 'apipay_oidc_state';
export const OIDC_NONCE_COOKIE = 'apipay_oidc_nonce';
export const OIDC_VERIFIER_COOKIE = 'apipay_oidc_verifier';
export const OIDC_RETURN_COOKIE = 'apipay_oidc_return';

export function requiredOidcConfig() {
  const issuer = process.env.PORTAL_OIDC_ISSUER?.replace(/\/$/, '');
  const clientId = process.env.PORTAL_OIDC_CLIENT_ID;
  const clientSecret = process.env.PORTAL_OIDC_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret || !issuer.startsWith('https://')) {
    throw new Error('HTTPS OIDC issuer, client ID and client secret are required');
  }
  return { issuer, clientId, clientSecret };
}

export async function discoverOidc(): Promise<OidcDiscovery> {
  const { issuer } = requiredOidcConfig();
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('OIDC discovery failed');
  const discovery = await response.json() as OidcDiscovery;
  if (discovery.issuer !== issuer || !discovery.authorization_endpoint?.startsWith('https://')
      || !discovery.token_endpoint?.startsWith('https://') || !discovery.jwks_uri?.startsWith('https://')) {
    throw new Error('OIDC discovery document is invalid');
  }
  return discovery;
}

export function randomBase64Url(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Buffer.from(bytes).toString('base64url');
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString('base64url');
}

export async function verifyIdToken(token: string, discovery: OidcDiscovery, nonce: string) {
  const { clientId } = requiredOidcConfig();
  const { payload } = await jwtVerify(token, createRemoteJWKSet(new URL(discovery.jwks_uri)), {
    issuer: discovery.issuer,
    audience: clientId,
    algorithms: ['RS256', 'ES256'],
    maxTokenAge: '10m',
  });
  if (payload.nonce !== nonce) throw new Error('OIDC nonce validation failed');
  if (process.env.PORTAL_OIDC_REQUIRE_MFA !== 'false') {
    const amr = Array.isArray(payload.amr) ? payload.amr.map(String) : [];
    if (!amr.some((method) => ['mfa', 'otp', 'hwk', 'webauthn'].includes(method.toLowerCase()))) {
      throw new Error('OIDC identity did not satisfy the MFA requirement');
    }
  }
  return payload;
}

export function roleFromClaims(payload: JWTPayload): PortalRole {
  const realmAccess = payload.realm_access as { roles?: unknown[] } | undefined;
  const roles = [
    ...(Array.isArray(payload.roles) ? payload.roles : []),
    ...(Array.isArray(realmAccess?.roles) ? realmAccess.roles : []),
  ].map((role) => String(role).toUpperCase());
  for (const role of ['OWNER', 'FINANCE', 'DEVELOPER', 'AUDITOR'] as PortalRole[]) {
    if (roles.includes(role) || roles.includes(`PAYMENTS_${role}`)) return role;
  }
  throw new Error('OIDC identity has no supported portal role');
}

export function safeReturnTo(candidate: string | null) {
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/dashboard';
}
