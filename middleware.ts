import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  isPanelRoute,
  isProtectedApiRoute,
  verifySessionToken,
} from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = await verifySessionToken(session);

  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  if (isPanelRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isProtectedApiRoute(pathname, req.method)) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/products/:path*',
    '/orders/:path*',
    '/categories/:path*',
    '/api/products/:path*',
    '/api/categories/:path*',
    '/api/contact/:path*',
    '/api/auth/login',
  ],
};
