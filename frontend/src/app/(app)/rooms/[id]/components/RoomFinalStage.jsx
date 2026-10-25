'use client';

import { Trophy, Download, ArrowLeft } from 'lucide-react';
import { getSingleCorrectAnswerIndex } from '../utils/msqHelpers';

export default function RoomFinalStage({
  stageState,
  activeChallenge,
  room,
  isEliminated,
  bossHp,
  userScore,
  correctCount,
  gameQuestions,
  showPostSprintReview,
  setShowPostSprintReview,
  currentLeaderboard,
  currentUserId,
  questionAnswersRecord,
  handleSaveMissedToVault,
  savingVault,
  handleShareVictoryCard,
  copiedVictoryCard,
  handleDownloadResultImage,
  handleBackToMainRoom
}) {
  if (stageState !== 'final') return null;

  const chMode = (activeChallenge?.gameMode || room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();

  return (
    <div className="card glass-panel" style={{ flex: 1, padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          {(() => {
            if (chMode === 'BOSS') {
              const bossDefeated = bossHp <= 0;
              return (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: bossDefeated ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: bossDefeated ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <Trophy size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                    {bossDefeated ? 'Dragon Defeated! 🐉⚔️' : 'The Boss Triumphed! 💀'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    {bossDefeated ? 'Your team successfully eliminated the boss!' : `Boss survived with ${bossHp} HP.`}
                  </p>
                </>
              );
            }

            if (chMode === 'SURVIVAL' && isEliminated) {
              return (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    💀
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                    Eliminated in Survival!
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    You earned {userScore} points before being eliminated.
                  </p>
                </>
              );
            }

            return (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <Trophy size={32} />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                  Sprint Completed! 🎉
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  You earned <strong>{userScore} points</strong> with <strong>{correctCount} / {gameQuestions?.length || 0} correct</strong>.
                </p>
              </>
            );
          })()}
        </div>

        {!showPostSprintReview ? (
          <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Final Standings
            </div>
            {currentLeaderboard.map((entry, rIdx) => {
              const isMe = entry.userId === currentUserId;
              return (
                <div
                  key={rIdx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: isMe ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-surface)',
                    border: isMe ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.15rem' }}>
                      {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `#${rIdx + 1}`}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                        {entry.userName} {isMe && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Avg Speed: {entry.avgSpeedSeconds}s / question
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#f59e0b' }}>
                      {entry.score} pts
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {entry.correctCount} correct
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Post-Sprint Question Review ({questionAnswersRecord.length} Questions)
            </div>
            {questionAnswersRecord.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${item.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Q{idx + 1}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                    {item.isCorrect ? 'CORRECT (+Points)' : item.isTimeout ? 'TIMED OUT' : 'WRONG'}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  {item.question.scenario}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Correct Answer:</strong> {item.question.options ? item.question.options[getSingleCorrectAnswerIndex(item.question)] : 'Answer key'}
                </div>
                {item.question.explanation && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {item.question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowPostSprintReview(prev => !prev)}
          className="btn btn-secondary"
          style={{ padding: '0.7rem 1.4rem' }}
        >
          {showPostSprintReview ? 'Show Standings' : 'Review Missed Questions'}
        </button>

        {showPostSprintReview && (
          <button
            onClick={handleSaveMissedToVault}
            disabled={savingVault}
            className="btn btn-secondary"
            style={{ padding: '0.7rem 1.4rem' }}
          >
            {savingVault ? 'Saving to Vault...' : 'Save Missed to Vault'}
          </button>
        )}

        <button
          onClick={handleShareVictoryCard}
          className="btn btn-secondary"
          style={{ padding: '0.7rem 1.4rem' }}
        >
          {copiedVictoryCard ? 'Copied Victory Card!' : 'Share Victory Card'}
        </button>

        <button
          onClick={() => handleDownloadResultImage(room?.activeChallenge)}
          className="btn btn-secondary"
          style={{ padding: '0.7rem 1.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={15} /> Save as Image
        </button>

        <button
          onClick={handleBackToMainRoom}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Return to Main Room
        </button>
      </div>
    </div>
  );
}
