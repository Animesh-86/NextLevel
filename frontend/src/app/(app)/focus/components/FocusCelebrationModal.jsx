'use client';

import { Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FocusCelebrationModal({
  showCelebration,
  setShowCelebration,
  awardedXp,
  selectedTaskId,
  tasks,
  handleToggleTaskStatus,
  sessionNotes,
  setSessionNotes
}) {
  if (!showCelebration) return null;

  const linkedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  return (
    <div className="dialog-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '420px',
        padding: '2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 20px 50px rgba(180,255,100,0.15)',
        border: '1px solid rgba(180,255,100,0.3)',
        animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(180, 255, 100, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand)',
          boxShadow: 'inset 0 0 15px rgba(180, 255, 100, 0.2)'
        }}>
          <Award size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>Focus Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Brilliant job! You completed your focus session.
          </p>
        </div>

        {/* XP Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--brand)',
          fontWeight: 700,
          fontSize: '1rem'
        }}>
          <Sparkles size={16} /> +{awardedXp} XP Awarded
        </div>

        {/* Quick action to complete linked task */}
        {linkedTask && linkedTask.status !== 'done' && (
          <button
            type="button"
            onClick={() => handleToggleTaskStatus(linkedTask.id, 'done')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <CheckCircle2 size={16} /> Mark &ldquo;{linkedTask.title}&rdquo; as Completed
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', marginTop: '8px' }}>
          <input
            type="text"
            className="input"
            placeholder="Add focus notes (e.g. studied math chapter 3)..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowCelebration(false);
              setSessionNotes('');
            }}
            style={{ width: '100%', padding: '10px' }}
          >
            Collect XP & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
