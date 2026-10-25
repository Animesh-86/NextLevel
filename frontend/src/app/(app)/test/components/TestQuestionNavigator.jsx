'use client';

import { Lock } from 'lucide-react';

export default function TestQuestionNavigator({
  questions = [],
  currentIdx,
  setCurrentIdx,
  answers = {},
  flagged = new Set(),
  lockedQuestions = new Set(),
  isOaBlitz = false,
  isStudy = false,
  checked = new Set(),
  checkedResults = {},
  setShowExplanation,
  toast,
  answeredCount
}) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigator
        </h3>
        {isOaBlitz && (
          <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
            <Lock size={10} /> Forward-Only
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
        {questions.map((q, i) => {
          const qId = q.id || q._id;
          const isAnswered = qId && (answers[qId] || []).length > 0;
          const isCurrent = i === currentIdx;
          const isFlag = flagged.has(i);
          const isLocked = isOaBlitz && (i < currentIdx || lockedQuestions.has(i));
          const isMSQ = q.type === 'MSQ';

          const checkResult = checkedResults ? checkedResults[qId] : null;
          const isQuestionChecked = isStudy && ((checked && checked.has(qId)) || !!checkResult);

          let backgroundColor = 'transparent';
          let borderColor = 'var(--border-strong)';
          let color = 'var(--text-primary)';
          let boxShadow = 'none';

          if (isQuestionChecked && checkResult) {
            if (checkResult.isCorrect) {
              if (isCurrent) {
                backgroundColor = '#10b981';
                borderColor = '#10b981';
                color = '#ffffff';
                boxShadow = '0 0 10px rgba(16, 185, 129, 0.45)';
              } else {
                backgroundColor = 'rgba(16, 185, 129, 0.2)';
                borderColor = '#10b981';
                color = '#34d399';
              }
            } else {
              if (isCurrent) {
                backgroundColor = '#ef4444';
                borderColor = '#ef4444';
                color = '#ffffff';
                boxShadow = '0 0 10px rgba(239, 68, 68, 0.45)';
              } else {
                backgroundColor = 'rgba(239, 68, 68, 0.2)';
                borderColor = '#ef4444';
                color = '#f87171';
              }
            }
          } else if (isCurrent) {
            backgroundColor = 'var(--text-primary)';
            borderColor = 'var(--text-primary)';
            color = 'var(--bg-primary)';
          } else if (isAnswered) {
            backgroundColor = 'var(--bg-accent)';
            borderColor = 'var(--border-strong)';
            color = 'var(--text-primary)';
          }

          if (isFlag) {
            borderColor = 'var(--warning)';
          }

          return (
            <button
              key={qId || i}
              type="button"
              onClick={() => {
                if (isOaBlitz) {
                  if (i < currentIdx || lockedQuestions.has(i)) {
                    toast.info('Questions are permanently locked once completed in OA Blitz mode.');
                    return;
                  }
                  if (i > currentIdx) {
                    toast.info('Questions must be answered in sequential order.');
                    return;
                  }
                  return;
                }
                setCurrentIdx(i);
                if (setShowExplanation) setShowExplanation(false);
              }}
              title={`Q${i + 1}${isLocked ? ' [Locked]' : ''}${isMSQ ? ' [MSQ]' : ''}${isQuestionChecked && checkResult ? (checkResult.isCorrect ? ' [Correct]' : ' [Incorrect]') : ''}`}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor,
                color,
                boxShadow,
                opacity: isLocked && !isCurrent ? 0.75 : 1,
                transition: 'all 0.15s',
                cursor: isLocked && !isCurrent ? 'not-allowed' : 'pointer',
                position: 'relative',
              }}
            >
              {i + 1}
              {isFlag && (
                <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', backgroundColor: 'var(--warning)', borderRadius: '50%' }} />
              )}
              {isLocked && !isCurrent && (
                <Lock size={9} style={{ position: 'absolute', bottom: '2px', right: '2px', opacity: 0.7 }} />
              )}
              {isMSQ && !isLocked && (
                <span
                  title="Multiple Select Question"
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '3px',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: isCurrent ? 'var(--bg-primary)' : '#eab308',
                    opacity: 0.9,
                  }}
                >
                  M
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {answeredCount}/{questions.length} answered
      </div>
    </div>
  );
}
