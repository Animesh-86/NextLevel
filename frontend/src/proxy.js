import { NextResponse } from 'next/server';

async function handleProxy(req) {
  const { pathname } = req.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/api/auth', '/'];
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  });

  // Just check if token cookie EXISTS — Spring Boot handles actual verification
  const token = req.cookies.get('token')?.value;
  const isLoggedIn = !!token;

  if (isPublicPath) {
    if (isLoggedIn && pathname === '/login' && !pathname.startsWith('/login/callback')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Protected routes: just check cookie exists
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export { handleProxy as proxy };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)',
  ],
};
