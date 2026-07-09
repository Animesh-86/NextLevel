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
  let token = req.cookies.get('token')?.value;
  console.log(`[PROXY] ${req.method} Request to ${pathname}`);
  console.log(`[PROXY] req.cookies token =`, token);
  
  if (!token) {
    const cookieHeader = req.headers.get('cookie');
    console.log(`[PROXY] req.headers.get('cookie') =`, cookieHeader);
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        token = match[1];
        console.log(`[PROXY] Parsed token from header:`, token ? "PRESENT" : "NULL");
      }
    }
  }

  const isLoggedIn = !!token;

  if (isPublicPath) {
    if (isLoggedIn && pathname === '/login' && !pathname.startsWith('/login/callback')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Protected routes: redirect to login if no token (except for /api/ which Spring Boot will handle)
  if (!isLoggedIn && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export { handleProxy as proxy };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)',
  ],
};
