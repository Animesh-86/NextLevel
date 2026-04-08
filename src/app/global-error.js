'use client';

export default function GlobalError({ error, unstable_retry }) {
  return (
    <html>
      <body style={{
        margin: 0, fontFamily: 'Inter, -apple-system, sans-serif',
        backgroundColor: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', textAlign: 'center', padding: '2rem',
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>💥</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Critical Error</h2>
          <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
            Something went seriously wrong. Please refresh the page.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: '0.75rem 2rem', backgroundColor: '#fff', color: '#000',
              border: 'none', borderRadius: '4px', fontWeight: 700,
              fontSize: '1rem', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
