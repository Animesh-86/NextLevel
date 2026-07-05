import { NextResponse } from 'next/server';

export async function POST() {
  // Try to forward logout to the backend (best effort)
  try {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
    await fetch(`${backendUrl}/api/auth/logout`, { method: 'POST' });
  } catch (err) {
    // Backend might be down, but we still want to clear the cookie
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear the HttpOnly cookie from the same origin - this is the only reliable way
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });

  return response;
}
