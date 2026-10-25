'use client';

import { Trophy } from 'lucide-react';

export default function RoomCheckpointStage({
  stageState,
  checkpointNextIdx,
  currentLeaderboard,
  userScore,
  currentUserId,
  resumeFromCheckpoint
}) {
  if (stageState !== 'checkpoint') return null;

  return (
    <div className="card" style={{ flex: 1, padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <Trophy size={28} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>
          🏁 Checkpoint Leaderboard!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {checkpointNextIdx} questions completed. Current live standings:
        </p>

        {/* Ranked Board */}
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          {currentLeaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
              You are in the lead with {userScore} points!
            </div>
          ) : (
            currentLeaderboard.map((entry, rIdx) => {
              const isMe = entry.userId === currentUserId;
              return (
                <div
                  key={rIdx}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: isMe ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface)',
                    border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', width: '22px' }}>
                      {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {entry.userName} {isMe && '(You)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {entry.questionsAnswered} ans
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f59e0b' }}>
                      {entry.score} pts
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={resumeFromCheckpoint}
          className="btn btn-primary"
          style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', fontWeight: 800 }}
        >
          Continue Next 5 Questions →
        </button>
      </div>
    </div>
  );
}
