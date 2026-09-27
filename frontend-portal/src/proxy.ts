import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_SESSION_COOKIE, roleCanAccess, verifyPortalSession } from '@/lib/portal-auth';

function requiredArea(pathname: string) {
  if (pathname.startsWith('/developers')) return 'developer' as const;
  if (pathname.startsWith('/operations')) return 'finance' as const;
  return 'dashboard' as const;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await verifyPortalSession(request.cookies.get(PORTAL_SESSION_COOKIE)?.value);

  if (pathname === '/login') {
    return session ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next();
  }
  if (pathname.startsWith('/api/gateway/v1/checkout/')) return NextResponse.next();

  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(login);
  }

  if (!pathname.startsWith('/api/') && !roleCanAccess(session.role, requiredArea(pathname))) {
    return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/developers/:path*', '/operations/:path*', '/api/gateway/:path*'],
};
