'use client';

import { Clock, ListFilter, LogOut, Volume2, VolumeX, ShieldAlert, Lock } from 'lucide-react';
import PerQuestionTimer from '@/components/PerQuestionTimer';

export default function TestHeaderBar({
  currentIdx,
  totalQuestions,
  isOaBlitz,
  questionTimeLeft,
  perQuestionSeconds,
  timeLeft,
  formatTime,
  timerCritical,
  timerWarning,
  timeMinutes,
  soundEnabled,
  setSoundEnabled,
  mode,
  proctorWarnings,
  setShowMobileNavigator,
  setShowExitModal,
  isStudy,
  goToReview,
  children
}) {
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="test-mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            Q{currentIdx + 1}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
              /{totalQuestions}
            </span>
          </span>
          {isOaBlitz && (
            <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
              OA Blitz
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOaBlitz ? (
            <PerQuestionTimer
              timeLeft={questionTimeLeft}
              totalDuration={perQuestionSeconds}
              size={36}
              strokeWidth={4}
              compact={true}
            />
          ) : isStudy ? (
            <span className="badge" style={{ fontSize: '0.72rem', padding: '2px 8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700 }}>
              SRS Mode
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: timerCritical ? '#ef4444' : 'var(--text-primary)' }}>
              <Clock size={13} /> {formatTime(timeLeft)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMobileNavigator(true)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="View Question Palette"
          >
            <ListFilter size={13} /> Qs
          </button>

          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="icon-btn"
            style={{ padding: '4px', color: 'var(--text-muted)' }}
            title="Exit Assessment"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Sidebar Controls (Desktop) */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }} className="test-sidebar test-desktop-sidebar">
        {isOaBlitz ? (
          <div className={`card ${questionTimeLeft <= 10 ? 'pulse-urgent-card' : ''}`} style={{ textAlign: 'center', borderColor: questionTimeLeft <= 10 ? '#ef4444' : questionTimeLeft <= 25 ? '#f59e0b' : 'var(--border-strong)' }}>
            <PerQuestionTimer
              timeLeft={questionTimeLeft}
              totalDuration={perQuestionSeconds}
              size={100}
              strokeWidth={7}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '0.6rem' }}>
              Question Timer ({perQuestionSeconds}s)
            </div>

            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Left:</span>
              <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(timeLeft)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="icon-btn"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: soundEnabled ? '#10b981' : 'var(--text-muted)' }}
                title="Toggle countdown sound"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{soundEnabled ? 'Tick Audio On' : 'Muted'}</span>
              </button>
            </div>
          </div>
        ) : isStudy ? null : (
          <div className="card" style={{ textAlign: 'center', borderColor: timerCritical ? 'var(--text-primary)' : timerWarning ? 'var(--warning)' : 'var(--border-strong)' }}>
            <div style={{
              fontSize: '2.25rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.05em',
              animation: timerCritical ? 'pulseBorder 1s infinite' : 'none',
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />Time Remaining
            </div>
            <div style={{ marginTop: '0.75rem', height: '4px', backgroundColor: 'var(--bg-accent)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, (timeLeft / (timeMinutes * 60)) * 100))}%`,
                backgroundColor: timerCritical ? 'var(--warning)' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
        )}

        {/* Simulation Proctoring Status Card */}
        {mode === 'simulation' && (
          <div
            className="card"
            style={{
              padding: '0.85rem',
              textAlign: 'center',
              backgroundColor: proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.08)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.3)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: proctorWarnings === 0 ? '#34d399' : proctorWarnings === 1 ? '#fbbf24' : '#f87171' }}>
              <ShieldAlert size={15} />
              <span>Simulation Proctor</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {proctorWarnings === 0 ? 'No infractions (0/3)' : `Warning ${proctorWarnings} of 3`}
            </div>
          </div>
        )}

        {/* OA Blitz Rules Badge */}
        {isOaBlitz && (
          <div
            className="card"
            style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
              <Lock size={13} /> Strict OA Rules
            </div>
            <div>Questions auto-lock upon advancing or timeout. Forward progression only.</div>
          </div>
        )}

        {children}

        {!isOaBlitz && (
          <button className="btn btn-secondary" onClick={goToReview} style={{ color: 'var(--text-muted)' }}>
            {isStudy ? 'End Session' : 'Review & Submit'}
          </button>
        )}
      </div>
    </>
  );
}
