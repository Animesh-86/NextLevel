import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper to get session in API routes by parsing the token cookie
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437');
    const { payload } = await jwtVerify(token, secret);
    
    // The Spring Boot JWT claims typically have: sub (id), email, role
    return { 
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role
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
