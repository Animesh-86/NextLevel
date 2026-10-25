'use client';

import { Network, Sparkles, PlusCircle } from 'lucide-react';

export default function GraphEmptyState({
  visible,
  onLoadDemo,
  onCreateCapture
}) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 20,
      textAlign: 'center',
      background: 'rgba(20, 20, 25, 0.92)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '2.5rem',
      maxWidth: '460px',
      width: '90%',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        margin: '0 auto 1.25rem',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(167, 139, 250, 0.2))',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a78bfa'
      }}>
        <Network size={30} />
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
        Knowledge Graph is Empty
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        The graph connects your notes, documents, and learning roadmaps into clusters. Capture new items or preview sample data to explore connections in 3D.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onLoadDemo}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #38bdf8, #a78bfa)', color: '#fff', border: 'none' }}
        >
          <Sparkles size={15} /> Load Demo Graph
        </button>
        <button
          onClick={onCreateCapture}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={15} /> Create Capture
        </button>
      </div>
    </div>
  );
}
