export function SkeletonCard({ height = '120px' }) {
  return (
    <div className="skeleton-card" style={{ height }}>
      <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
      <div className="skeleton-line" style={{ width: '80%', height: '28px', marginTop: '12px' }} />
      <div className="skeleton-line" style={{ width: '40%', height: '12px', marginTop: '8px' }} />
    </div>
  );
}

export function SkeletonText({ lines = 3, width }) {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            width: width || `${100 - i * 15}%`,
            height: '14px',
            marginBottom: '8px',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton-line"
              style={{ flex: 1, height: '14px', margin: '0 8px' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
