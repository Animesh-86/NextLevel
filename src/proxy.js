import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

async function handleProxy(req) {
  const session = await auth();
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!session;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    // Redirect logged-in users away from login page
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminPaths = ['/manage', '/exams'];
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  if (isAdminPath && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export { handleProxy as proxy };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)',
  ],
};
