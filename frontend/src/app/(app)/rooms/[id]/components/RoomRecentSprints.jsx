'use client';

import { Trophy, ChevronRight } from 'lucide-react';

export default function RoomRecentSprints({
  isTimerExpanded,
  room,
  viewingPastChallenge,
  setViewingPastChallenge
}) {
  const pastChallenges = room?.pastChallenges || [];

  return (
    <div className="card glass-panel" style={{
      flex: isTimerExpanded ? '0 0 0px' : '1 1 0',
      maxWidth: isTimerExpanded ? '0px' : '100%',
      opacity: isTimerExpanded ? 0 : 1,
      overflow: 'hidden',
      padding: isTimerExpanded ? '0' : '1.15rem 1.35rem',
      background: 'var(--bg-surface)',
      border: isTimerExpanded ? '0px solid transparent' : '1px solid var(--border-light)',
      borderRadius: '16px',
      height: '100%',
      minHeight: 0,
      pointerEvents: isTimerExpanded ? 'none' : 'auto',
      transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, padding 0.4s ease, border 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Trophy size={18} style={{ color: '#f59e0b' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Recent Sprints</h4>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '12px' }}>
          {pastChallenges.length} recorded
        </span>
      </div>

      {pastChallenges.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={18} style={{ opacity: 0.4 }} />
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            No sprints completed yet in this room.
          </div>
          <p style={{ fontSize: '0.74rem', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>
            Pick an arena above to start your first multiplayer challenge!
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto', padding: '4px 2px 4px 2px' }}>
          {pastChallenges.map((ch, idx) => {
            const top = ch.leaderboard && ch.leaderboard.length > 0 ? ch.leaderboard[0] : null;
            const modeTag = ch.gameMode === 'BOSS' ? 'Co-op Boss' : ch.gameMode === 'SURVIVAL' ? 'Survival' : ch.gameMode === 'TEAMS' ? 'Squad' : 'OA Blitz';
            const isViewing = viewingPastChallenge && (viewingPastChallenge.title === ch.title && viewingPastChallenge.createdAt === ch.createdAt);
            return (
              <div
                key={idx}
                onClick={() => setViewingPastChallenge(ch)}
                style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: '8px',
                  background: isViewing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: isViewing ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
                  boxShadow: isViewing ? '0 0 0 1px #f59e0b' : 'none',
                  boxSizing: 'border-box',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 0 0 1px #f59e0b';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isViewing ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = isViewing ? '#f59e0b' : 'var(--border-light)';
                  e.currentTarget.style.boxShadow = isViewing ? '0 0 0 1px #f59e0b' : 'none';
                }}
                title="Click to view sprint standings & export result image"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{ch.title}</span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', fontWeight: 700 }}>
                      {modeTag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {ch.questionCount}Q • {ch.perQuestionSeconds}s/Q
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ch.status === 'CANCELLED' ? (
                    <span style={{ fontSize: '0.68rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      Cancelled
                    </span>
                  ) : top ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        🥇 {top.userName}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>
                        {top.score} pts
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Concluded</span>
                  )}
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
