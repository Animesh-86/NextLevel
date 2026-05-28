export default function TestLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="skeleton-card" style={{ maxWidth: '440px', width: '100%', height: '380px' }}>
        <div className="skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '1rem' }} />
        <div className="skeleton-line" style={{ width: '80%', height: '14px', marginBottom: '2rem' }} />
        <div className="skeleton-line" style={{ width: '100%', height: '44px', marginBottom: '1rem' }} />
        <div className="skeleton-line" style={{ width: '100%', height: '44px', marginBottom: '1rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="skeleton-line" style={{ height: '44px' }} />
          <div className="skeleton-line" style={{ height: '44px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '100%', height: '48px' }} />
      </div>
    </div>
  );
}
