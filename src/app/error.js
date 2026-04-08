'use client';
import { useEffect } from 'react';

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', textAlign: 'center', padding: '2rem',
    }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>⚠</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
          An unexpected error occurred. Please try again.
        </p>
        <button className="btn btn-primary" onClick={() => unstable_retry()}>
          Try Again
        </button>
      </div>
    </div>
  );
}
