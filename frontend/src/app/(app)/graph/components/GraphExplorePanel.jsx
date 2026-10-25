'use client';

import { X, ExternalLink, Loader2, Sparkles } from 'lucide-react';

export default function GraphExplorePanel({
  exploreNode,
  onClose,
  onNavigate,
  onAnalyze,
  analyzing,
  aiExplanation
}) {
  if (!exploreNode) return null;

  return (
    <div className="graph-explore-panel card" style={{
      position: 'absolute', top: '20px', right: '20px', zIndex: 10,
      width: '350px', maxWidth: 'calc(100vw - 40px)',
      background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Explore Node
        </h3>
        <button onClick={onClose} className="icon-btn" style={{ padding: 0 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
          {exploreNode.type}
        </span>
        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
          {exploreNode.name}
        </h4>

        <button
          onClick={() => onNavigate(exploreNode)}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <ExternalLink size={14} /> Open {exploreNode.type}
        </button>
      </div>

      <div>
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', background: 'linear-gradient(45deg, var(--brand-purple), var(--brand-blue))', border: 'none', color: '#ffffff' }}
        >
          {analyzing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {analyzing ? 'Analyzing connections...' : 'AI Connection Analysis'}
        </button>
      </div>

      {aiExplanation && (
        <div style={{
          background: 'rgba(124, 58, 237, 0.1)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          color: 'var(--text-secondary)'
        }}>
          {aiExplanation}
        </div>
      )}
    </div>
  );
}
