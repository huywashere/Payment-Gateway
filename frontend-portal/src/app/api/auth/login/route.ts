import { NextResponse } from 'next/server';
import { createPortalSession, PORTAL_SESSION_COOKIE, portalAuthMode, portalMode, securePortalCookies, type PortalRole } from '@/lib/portal-auth';

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();

const DEMO_USERS: Record<string, PortalRole> = {
  'owner@novagate.local': 'OWNER',
  'developer@novagate.local': 'DEVELOPER',
  'finance@novagate.local': 'FINANCE',
  'auditor@novagate.local': 'AUDITOR',
};

function configuredCredential(name: string, developmentValue: string) {
  const value = process.env[name]?.trim();
  if (value) return value;
  return process.env.NODE_ENV === 'production' ? null : developmentValue;
}

async function sameValue(left: string, right: string) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(left)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(right)),
  ]);
  const first = new Uint8Array(a);
  const second = new Uint8Array(b);
  let difference = first.length ^ second.length;
  for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
  return difference === 0;
}

export async function POST(request: Request) {
  if (portalAuthMode() !== 'demo') {
    return NextResponse.json({ error: 'Password login is disabled; use the configured identity provider' }, { status: 404 });
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Cross-origin login is not allowed' }, { status: 403 });
  }
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const identity = forwarded || 'local';
  const now = Date.now();
  const current = attempts.get(identity);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const mfaCode = String(body.mfaCode || '');
  const role = DEMO_USERS[email];
  const expectedPassword = configuredCredential('PORTAL_DEMO_PASSWORD', 'ProjectDemo!2026');
  const expectedMfa = configuredCredential('PORTAL_DEMO_MFA_CODE', '246810');

  if (!role || !expectedPassword || !expectedMfa
      || !(await sameValue(password, expectedPassword)) || !(await sameValue(mfaCode, expectedMfa))) {
    attempts.set(identity, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: now + 5 * 60_000 });
    return NextResponse.json({ error: 'Email, password or MFA code is incorrect' }, { status: 401 });
  }

  attempts.delete(identity);
  const token = await createPortalSession({
    email, role, authMethod: 'demo',
    merchantId: process.env.PORTAL_DEMO_MERCHANT_ID || '11111111-1111-1111-1111-111111111111',
    environment: portalMode(),
  });
  const response = NextResponse.json({ authenticated: true, role, environment: portalMode() });
  response.cookies.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: securePortalCookies(),
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return response;
}
