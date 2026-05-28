'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store token in a cookie that is accessible by our Next.js API routes
      document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      router.push('/dashboard');
    } else {
      router.push('/login?error=OAuthFailed');
    }
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div className="auth-spinner" style={{ borderTopColor: 'var(--text-primary)', width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }} />
      <p>Completing sign in...</p>
    </div>
  );
}
