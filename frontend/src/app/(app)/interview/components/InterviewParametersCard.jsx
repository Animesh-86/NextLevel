'use client';
import { ShieldCheck, Mic, ArrowRight, CalendarDays } from 'lucide-react';
import { EXPERIENCE_LEVELS, DURATIONS } from './interviewConstants';

export default function InterviewParametersCard({
  experienceLevel,
  setExperienceLevel,
  durationMinutes,
  setDurationMinutes,
  onOpenPreflight,
  startingSession,
  uploadingResume,
  onOpenSchedule,
}) {
  const chipStyle = (isActive) => ({
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border-light)',
    background: isActive ? 'var(--accent-tint)' : 'rgba(255, 255, 255, 0.02)',
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    transition: 'all 0.15s ease'
  });

  return (
    <>
      <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
          <ShieldCheck size={18} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Parameters & Duration</h2>
        </div>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seniority Level
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button key={lvl.value} type="button" onClick={() => setExperienceLevel(lvl.value)} style={chipStyle(experienceLevel === lvl.value)}>
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Session Duration
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {DURATIONS.map((d) => (
              <button key={d.minutes} type="button" onClick={() => setDurationMinutes(d.minutes)} style={chipStyle(durationMinutes === d.minutes)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Launch & Schedule CTAs */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onOpenPreflight}
          disabled={startingSession || uploadingResume}
          className="btn btn-primary"
          style={{
            flex: '1 1 240px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: startingSession || uploadingResume ? 'not-allowed' : 'pointer',
            opacity: startingSession || uploadingResume ? 0.7 : 1
          }}
        >
          <Mic size={18} /> Begin Mock Interview <ArrowRight size={17} />
        </button>
        <button
          type="button"
          onClick={onOpenSchedule}
          disabled={startingSession}
          className="btn"
          style={{
            padding: '1rem 1.4rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            cursor: startingSession ? 'not-allowed' : 'pointer'
          }}
          title="Schedule this mock interview in your Planner"
        >
          <CalendarDays size={18} color="#ffffff" /> Schedule
        </button>
      </div>
    </>
  );
}
