import { NextResponse } from 'next/server';
import { sessionTokenFromCookie, verifyPortalSession } from '@/lib/portal-auth';

export async function GET(request: Request) {
  const session = await verifyPortalSession(sessionTokenFromCookie(request.headers.get('cookie')));
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, session }, { headers: { 'cache-control': 'no-store' } });
}
