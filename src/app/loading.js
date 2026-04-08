export default function Loading() {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', padding: '0.5rem' }}>
      <div className="skeleton-line" style={{ width: '200px', height: '28px', marginBottom: '0.5rem' }} />
      <div className="skeleton-line" style={{ width: '300px', height: '14px', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="skeleton-card" style={{ height: '110px' }} />
        <div className="skeleton-card" style={{ height: '110px' }} />
        <div className="skeleton-card" style={{ height: '110px' }} />
        <div className="skeleton-card" style={{ height: '110px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="skeleton-card" style={{ height: '350px' }} />
        <div className="skeleton-card" style={{ height: '350px' }} />
      </div>
    </div>
  );
}
