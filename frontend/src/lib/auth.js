import { cookies } from 'next/headers';

// Helper to get session in API routes by calling backend
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { error: 'Invalid Token', status: 401 };
    }

    const data = await res.json();
    return { 
      user: data.data.user
    };
  } catch (err) {
    return { error: 'Internal Server Error', status: 500 };
  }
}

export async function requireAdmin() {
  const result = await requireAuth();
  if (result.error) return result;
  
  if (result.user.role !== 'admin' && result.user.role !== 'ADMIN') {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }
  return result;
}
