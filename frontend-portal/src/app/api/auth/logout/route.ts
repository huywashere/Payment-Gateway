import { NextResponse } from 'next/server';
import { PORTAL_SESSION_COOKIE } from '@/lib/portal-auth';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Cross-origin logout is not allowed' }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PORTAL_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
