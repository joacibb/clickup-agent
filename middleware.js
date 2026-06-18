import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  // Allow next internals, login endpoint and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/login') ||
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get ? req.cookies.get('auth')?.value : null;

  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image|api/login|login|favicon.ico).*)'],
};
