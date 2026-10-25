'use client';

import { Shield, Flame } from 'lucide-react';
import { getSingleCorrectAnswerIndex } from '../utils/msqHelpers';

export default function RoomLiveQuestionStage({
  stageState,
  gameQuestions,
  currentQIdx,
  activeChallenge,
  room,
  bossHp,
  bossMaxHp,
  teamAlphaScore,
  teamBetaScore,
  selectedOption,
  isAnswerEvaluated,
  isEliminated,
  handleOptionClick,
  handleAdvanceQuestion
}) {
  if (stageState !== 'live_question' || !gameQuestions || gameQuestions.length === 0) return null;

  const currentQ = gameQuestions[currentQIdx];
  if (!currentQ) return null;

  const chMode = (activeChallenge?.gameMode || room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();

  return (
    <div className="card glass-panel" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.5rem 1.75rem',
      borderRadius: '16px',
      border: '1px solid var(--border-strong)',
      background: 'rgba(15, 17, 23, 0.95)',
      position: 'relative'
    }}>
      <div>
        {/* 1. Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#f59e0b'
            }}>
              <Shield size={13} style={{ color: '#f59e0b' }} />
              <span>Proctored</span>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
              {activeChallenge?.title || room?.activeChallenge?.title || 'OA Blitz Sprint'}
            </span>
          </div>
        </div>

        {/* 2. Segmented Horizontal Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          marginBottom: '1.35rem'
        }}>
          {gameQuestions.map((_, qIdx) => {
            const isPassedOrActive = qIdx <= currentQIdx;
            return (
              <div
                key={qIdx}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: isPassedOrActive ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isPassedOrActive ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'background 0.3s ease'
                }}
              />
            );
          })}
        </div>

        {/* 3. Subheader: Question X of Y */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '1.35rem'
        }}>
          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
            Question {currentQIdx + 1} of {gameQuestions.length}
          </span>
          <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            {currentQ.topic || 'General Practice'}
          </span>
        </div>

        {/* Boss Battle HP Bar Banner (if BOSS mode) */}
        {chMode === 'BOSS' && (
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 800, fontSize: '0.85rem' }}>
                <Flame size={15} />
                <span>Dragon Boss HP</span>
              </div>
              <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, color: '#ffffff' }}>
                {bossHp} / {bossMaxHp} HP
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, Math.min(100, (bossHp / (bossMaxHp || 100)) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f97316)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Team Match Aggregate Bar (if TEAMS mode) */}
        {chMode === 'TEAMS' && (
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60a5fa' }}>Team Alpha: {teamAlphaScore} pts</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f87171' }}>Team Beta: {teamBetaScore} pts</span>
            </div>
            {(() => {
              const totalPts = Math.max(1, teamAlphaScore + teamBetaScore);
              const alphaPct = Math.round((teamAlphaScore / totalPts) * 100);
              const betaPct = 100 - alphaPct;
              return (
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${alphaPct}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }} />
                  <div style={{ width: `${betaPct}%`, height: '100%', background: '#ef4444', transition: 'width 0.3s ease' }} />
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. Question Scenario Title */}
        <h3 style={{
          fontSize: '1.22rem',
          fontWeight: 800,
          lineHeight: 1.5,
          color: '#ffffff',
          marginBottom: '1.5rem'
        }}>
          {currentQ.scenario}
        </h3>

        {/* 5. Multiple Choice Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {(currentQ.options || []).map((opt, oIdx) => {
            const isSelected = selectedOption === oIdx;
            const singleCorrectIdx = getSingleCorrectAnswerIndex(currentQ);
            const isOptionCorrect = singleCorrectIdx === oIdx;

            let blockBorder = '1px solid rgba(255, 255, 255, 0.08)';
            let blockBg = 'rgba(255, 255, 255, 0.025)';
            let blockColor = 'rgba(255, 255, 255, 0.9)';
            let badgeBg = 'rgba(255, 255, 255, 0.07)';
            let badgeColor = 'rgba(255, 255, 255, 0.7)';

            if (isAnswerEvaluated) {
              if (isSelected) {
                if (isOptionCorrect) {
                  blockBorder = '2px solid #10b981';
                  blockBg = 'rgba(16, 185, 129, 0.2)';
                  blockColor = '#34d399';
                  badgeBg = '#10b981';
                  badgeColor = '#ffffff';
                } else {
                  blockBorder = '2px solid #ef4444';
                  blockBg = 'rgba(239, 68, 68, 0.2)';
                  blockColor = '#f87171';
                  badgeBg = '#ef4444';
                  badgeColor = '#ffffff';
                }
              } else if (isOptionCorrect) {
                blockBorder = '2px solid #10b981';
                blockBg = 'rgba(16, 185, 129, 0.15)';
                blockColor = '#34d399';
                badgeBg = '#10b981';
                badgeColor = '#ffffff';
              }
            } else if (isSelected) {
              blockBorder = '1.5px solid #10b981';
              blockBg = 'rgba(16, 185, 129, 0.08)';
              badgeBg = '#10b981';
              badgeColor = '#ffffff';
            }

            return (
              <div
                key={oIdx}
                onClick={() => handleOptionClick(oIdx)}
                style={{
                  textAlign: 'left',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '12px',
                  border: blockBorder,
                  background: blockBg,
                  color: blockColor,
                  fontSize: '0.92rem',
                  fontWeight: (isSelected || (isAnswerEvaluated && isOptionCorrect)) ? 700 : 500,
                  cursor: (isAnswerEvaluated || isEliminated) ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAnswerEvaluated && !isEliminated) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnswerEvaluated && !isEliminated) {
                    e.currentTarget.style.borderColor = blockBorder;
                    e.currentTarget.style.background = blockBg;
                  }
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  background: badgeBg,
                  color: badgeColor,
                  flexShrink: 0
                }}>
                  {isAnswerEvaluated && isSelected ? (isOptionCorrect ? '✓' : '✕') : isAnswerEvaluated && isOptionCorrect ? '✓' : String.fromCharCode(65 + oIdx)}
                </div>
                <span style={{ flex: 1, lineHeight: 1.45 }}>{opt}</span>
                {isAnswerEvaluated && isSelected && isOptionCorrect && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>Correct</span>
                )}
                {isAnswerEvaluated && isSelected && !isOptionCorrect && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>Incorrect</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Bottom footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.75rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
          Press A to D to pick, Enter to confirm
        </span>
        <button
          type="button"
          onClick={() => handleAdvanceQuestion(false)}
          disabled={selectedOption === null && !isEliminated}
          className="btn btn-secondary"
          style={{
            padding: '0.6rem 1.6rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            opacity: (selectedOption === null && !isEliminated) ? 0.4 : 1,
            cursor: (selectedOption === null && !isEliminated) ? 'not-allowed' : 'pointer'
          }}
        >
          {currentQIdx >= gameQuestions.length - 1 ? 'Finish Sprint' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
