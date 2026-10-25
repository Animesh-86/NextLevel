'use client';
import { Play, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InterviewHeader({ activeTab, setActiveTab }) {
  const router = useRouter();

  return (
    <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
            AI Mock Interview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: 0 }}>
            {activeTab === 'setup'
              ? 'Voice-interactive AI technical interviewer with resume project verification, proctoring, and comprehensive scorecards.'
              : 'Review your completed mock interviews, hiring scorecards, transcripts, and feedback.'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('setup'); router.push('/interview', { scroll: false }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'setup' ? '#fafafa' : 'transparent',
              color: activeTab === 'setup' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
              boxShadow: activeTab === 'setup' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={15} style={{ fill: activeTab === 'setup' ? '#09090b' : 'none', color: activeTab === 'setup' ? '#09090b' : 'currentColor' }} /> Practice Interview
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('history'); router.push('/interview?tab=history', { scroll: false }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'history' ? '#fafafa' : 'transparent',
              color: activeTab === 'history' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
              boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Trophy size={15} style={{ color: activeTab === 'history' ? '#09090b' : 'currentColor' }} /> Interview Results & History
          </button>
        </div>
      </div>
    </header>
  );
}
