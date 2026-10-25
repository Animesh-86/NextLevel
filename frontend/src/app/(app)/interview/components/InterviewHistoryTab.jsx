'use client';
import { Play, Trophy, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InterviewHistoryTab({
  sessions,
  loadingHistory,
  onStartNew,
  onDeleteSession,
}) {
  const router = useRouter();

  return (
    <section style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f4f4f6' }}>
            Past Mock Interviews & Hiring Scorecards
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#a1a1ad', margin: '4px 0 0' }}>
            Review your technical evaluations, proctoring integrity, transcripts, and AI suggestions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1ad', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '20px' }}>
            {sessions.length} {sessions.length === 1 ? 'SESSION' : 'SESSIONS'}
          </span>
          <button
            type="button"
            onClick={onStartNew}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={14} /> Start New Interview
          </button>
        </div>
      </div>

      {loadingHistory ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1ad' }}>
          <Loader2 size={24} className="auth-spinner" style={{ margin: '0 auto 0.5rem' }} />
          Loading history...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '16px', background: 'var(--surface-1, #101014)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f6' }}>No interviews completed yet.</div>
          <div style={{ fontSize: '0.82rem', color: '#71717a', marginTop: '6px', maxWidth: '420px', margin: '6px auto 1.5rem' }}>
            Launch your first voice-interactive technical mock interview to receive a full proctoring scorecard and actionable feedback.
          </div>
          <button
            type="button"
            onClick={onStartNew}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
          >
            <Play size={15} style={{ marginRight: '6px' }} /> Configure Mock Interview
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {sessions.map((sess) => {
            const hasScore = sess.scorecard && sess.scorecard.overallScore !== undefined;
            const isNotEval = !hasScore || sess.scorecard?.overallScore === 0;
            return (
              <div
                key={sess.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'var(--surface-1, #101014)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  transition: 'border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f4f4f6' }}>
                      {sess.role}
                    </div>
                    {hasScore && !isNotEval && (
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                        {sess.scorecard.overallScore}%
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#a1a1ad', marginTop: '3px' }}>
                    {sess.experienceLevel} • {sess.durationMinutes} min • {new Date(sess.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => router.push(sess.status === 'COMPLETED' ? `/interview/${sess.id}/scorecard` : `/interview/${sess.id}`)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fafafa',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {sess.status === 'COMPLETED' ? 'View Scorecard' : 'Resume Session'} <ChevronRight size={13} />
                  </button>

                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
