import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

// Helper to get session in API routes by parsing the token cookie
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const payload = decodeJwt(token);
    
    // The Spring Boot JWT claims typically have: sub (id), email, role
    return { 
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name || payload.email
      } 
    };
  } catch (err) {
    return { error: 'Invalid Token', status: 401 };
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
