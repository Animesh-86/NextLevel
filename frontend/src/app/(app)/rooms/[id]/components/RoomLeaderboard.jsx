'use client';

export default function RoomLeaderboard({
  stageState,
  proctorWarnings,
  handleCancelChallenge,
  userScore,
  questionTimeRemaining,
  currentChallengeDuration,
  currentLeaderboard,
  currentUserId,
  currentUserName,
  currentQIdx,
  gameQuestions,
  participantsList,
  handleAdvanceQuestion,
  selectedOption,
  isEliminated
}) {
  if (stageState !== 'live_question') return null;

  let board = [...currentLeaderboard];
  const myEntryIdx = board.findIndex(e => e.userId === currentUserId);
  if (myEntryIdx >= 0) {
    board[myEntryIdx] = {
      ...board[myEntryIdx],
      score: Math.max(board[myEntryIdx].score || 0, userScore),
      questionsAnswered: currentQIdx + 1
    };
  } else {
    board.push({
      userId: currentUserId,
      userName: currentUserName || 'You',
      score: userScore,
      questionsAnswered: currentQIdx + 1
    });
  }

  participantsList.forEach(p => {
    if (!board.some(e => e.userId === p.userId)) {
      board.push({
        userId: p.userId,
        userName: p.userName || 'Peer',
        score: 0,
        questionsAnswered: 0
      });
    }
  });

  board.sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="card glass-panel" style={{
      flex: '0 0 auto',
      maxHeight: '48%',
      display: 'flex',
      flexDirection: 'column',
      padding: '0.85rem 1rem',
      borderRadius: '14px',
      background: 'rgba(15, 17, 23, 0.95)',
      border: '1px solid var(--border-light)',
      boxSizing: 'border-box'
    }}>
      {/* Top Row: Warnings + Exit Sprint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: proctorWarnings > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.55)'
        }}>
          Warnings {proctorWarnings}/3
        </span>
        <button
          type="button"
          onClick={handleCancelChallenge}
          style={{
            padding: '3px 12px',
            borderRadius: '16px',
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            color: '#ef4444',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
          }}
        >
          Exit sprint
        </button>
      </div>

      {/* Center Stats: Points + Circular Timer Gauge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.75rem',
        padding: '0.3rem 0',
        marginBottom: '0.35rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Points */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
            {userScore}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, marginTop: '2px' }}>
            points
          </div>
        </div>

        {/* Circular Timer Gauge */}
        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
          <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke={questionTimeRemaining <= 5 ? '#ef4444' : '#10b981'}
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - (questionTimeRemaining / (currentChallengeDuration || 30)))}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: questionTimeRemaining <= 5 ? '#ef4444' : '#ffffff'
          }}>
            {questionTimeRemaining}s
          </div>
        </div>
      </div>

      {/* Leaderboard entries */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: '2px'
      }}>
        {board.map((entry, rIdx) => {
          const isMe = entry.userId === currentUserId;
          return (
            <div
              key={entry.userId || rIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                background: isMe ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.035)',
                border: isMe ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-light)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '18px', flexShrink: 0, textAlign: 'center' }}>
                  {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                </span>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: isMe ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                  color: isMe ? '#000000' : '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {(entry.userName || '?')[0].toUpperCase()}
                </div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: isMe ? 800 : 600,
                  color: isMe ? '#ffffff' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {entry.userName} {isMe && '(You)'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f59e0b', flexShrink: 0 }}>
                {entry.score || 0} pts
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action in Leaderboard: Next question / Finish Sprint */}
      <button
        type="button"
        onClick={() => handleAdvanceQuestion(false)}
        disabled={selectedOption === null && !isEliminated}
        className="btn btn-secondary"
        style={{
          width: '100%',
          padding: '0.45rem',
          fontSize: '0.78rem',
          fontWeight: 800,
          borderRadius: '8px',
          marginTop: '0.45rem',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--border-light)',
          opacity: (selectedOption === null && !isEliminated) ? 0.4 : 1,
          cursor: (selectedOption === null && !isEliminated) ? 'not-allowed' : 'pointer'
        }}
      >
        {currentQIdx >= gameQuestions.length - 1 ? 'Finish Sprint' : 'Next question →'}
      </button>
    </div>
  );
}
