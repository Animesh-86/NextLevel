import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', textAlign: 'center', padding: '2rem',
    }}>
      <div>
        <div style={{ fontSize: '6rem', fontWeight: 900, letterSpacing: '-0.05em', opacity: 0.1, marginBottom: '-0.5rem' }}>404</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
