import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Basic in-memory rate limiter for serverless (per-instance)
const rateLimitMap = new Map();
const RATE_LIMIT = 150; // max requests
const WINDOW_MS = 60 * 1000; // 1 minute window

function applyRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Clean up old entries occasionally (naive approach)
  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear();
  }

  const currentData = rateLimitMap.get(ip) || { count: 0, timestamp: now };
  if (currentData.timestamp < windowStart) {
    currentData.count = 0;
    currentData.timestamp = now;
  }

  currentData.count++;
  rateLimitMap.set(ip, currentData);

  return currentData.count <= RATE_LIMIT;
}

/**
 * Verify JWT directly from the request cookies.
 * This avoids using `cookies()` from next/headers which does NOT work
 * reliably in middleware context.
 */
async function verifyTokenFromRequest(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    );
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    return null;
  }
}

async function handleProxy(req) {
  // 1. Rate Limiting Check
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!applyRateLimit(ip)) {
    return new NextResponse('Too Many Requests. Please slow down.', { status: 429 });
  }

  const { pathname } = req.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/api/auth', '/'];
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  });

  // For public paths, only do the JWT check if we need to redirect logged-in users away from /login
  if (isPublicPath) {
    if (pathname === '/login') {
      const user = await verifyTokenFromRequest(req);
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes: verify JWT from request cookies
  const user = await verifyTokenFromRequest(req);

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminPaths = ['/manage', '/exams'];
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  if (isAdminPath && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export { handleProxy as proxy };

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)',
  ],
};
