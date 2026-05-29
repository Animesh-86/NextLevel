'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.success && data.data) {
          setSession({ user: data.data });
        }
      } catch (err) {
        // Not logged in
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

export function signOut({ callbackUrl = '/login' } = {}) {
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  window.location.href = callbackUrl;
}
