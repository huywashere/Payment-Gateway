export const PORTAL_SESSION_COOKIE = 'apipay_portal_session';

export type PortalRole = 'OWNER' | 'DEVELOPER' | 'FINANCE' | 'AUDITOR';

export type PortalSession = {
  email: string;
  subject?: string;
  authMethod?: 'demo' | 'oidc';
  role: PortalRole;
  merchantId: string;
  environment: 'sandbox' | 'live';
  issuedAt: number;
  expiresAt: number;
};

const encoder = new TextEncoder();

function sessionSecret() {
  const configured = process.env.PORTAL_SESSION_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PORTAL_SESSION_SECRET must contain at least 32 characters');
  }
  return 'development-only-session-secret-change-me';
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey() {
  return crypto.subtle.importKey(
    'raw', encoder.encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify'],
  );
}

export async function createPortalSession(input: Omit<PortalSession, 'issuedAt' | 'expiresAt'>) {
  const now = Math.floor(Date.now() / 1000);
  const payload: PortalSession = { ...input, issuedAt: now, expiresAt: now + 8 * 60 * 60 };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(encodedPayload));
  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyPortalSession(token?: string | null): Promise<PortalSession | null> {
  if (!token) return null;
  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC', await hmacKey(), decodeBase64Url(encodedSignature), encoder.encode(encodedPayload),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as PortalSession;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.email || !payload.role || !payload.merchantId
        || payload.expiresAt <= now || payload.issuedAt > now + 60
        || payload.expiresAt - payload.issuedAt > 8 * 60 * 60) return null;
    if (!['OWNER', 'DEVELOPER', 'FINANCE', 'AUDITOR'].includes(payload.role)) return null;
    if (portalMode() === 'live' && payload.authMethod !== 'oidc') return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === PORTAL_SESSION_COOKIE) return decodeURIComponent(value.join('='));
  }
  return null;
}

export function portalMode(): 'sandbox' | 'live' {
  return process.env.GATEWAY_MODE?.toLowerCase() === 'live' ? 'live' : 'sandbox';
}

export function portalAuthMode(): 'demo' | 'oidc' {
  const configured = process.env.PORTAL_AUTH_MODE?.toLowerCase();
  if (configured === 'oidc') return 'oidc';
  if (portalMode() === 'live') {
    throw new Error('PORTAL_AUTH_MODE=oidc is required for a production/live portal');
  }
  return 'demo';
}

export function securePortalCookies() {
  return process.env.NODE_ENV === 'production' && process.env.PORTAL_SECURE_COOKIES !== 'false';
}

export function roleCanAccess(role: PortalRole, area: 'dashboard' | 'developer' | 'finance' | 'audit') {
  const permissions: Record<PortalRole, string[]> = {
    OWNER: ['dashboard', 'developer', 'finance', 'audit'],
    DEVELOPER: ['dashboard', 'developer'],
    FINANCE: ['dashboard', 'finance', 'audit'],
    AUDITOR: ['dashboard', 'audit'],
  };
  return permissions[role].includes(area);
}
