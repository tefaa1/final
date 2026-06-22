import { NextResponse } from 'next/server';
import { canAccess } from '@/src/lib/permissions';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const userRole = request.cookies.get('user_role')?.value;

  // 1. Already logged in trying to visit /login -> push to dashboard
  if (pathname === '/login' && userRole) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Dashboard area: require auth + per-route role check
  if (pathname.startsWith('/dashboard')) {
    if (!userRole) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Authorize against the shared role map. Admin is always allowed.
    if (!canAccess(pathname, userRole)) {
      // Avoid redirect loops: if they were already heading to /dashboard
      // and it failed, fall through (it won't, /dashboard is "any").
      if (pathname !== '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
