'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await apiFetch('/api/user/profile');
        if (!res.ok) {
           throw new Error('Not logged in');
        }
        const data = await res.json();
        if (data.success && data.data) {
          setSession({ user: data.data });
        }
      } catch (err) {
        // Not logged in or error
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const { session, loading } = useContext(AuthContext);
  return { data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated' };
}

export async function signOut({ callbackUrl = '/login' } = {}) {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  // Also try to clear any non-HttpOnly copies
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'token=; path=/; max-age=0';
  
  if (typeof window !== 'undefined') {
    window.location.href = callbackUrl;
  }
}
