'use client';

import {
  Flag, LogOut, Info, Check, X, Sparkles, Loader2,
  ChevronLeft, ChevronRight, Lock
} from 'lucide-react';

export default function TestQuestionCard({
  currentQ,
  currentIdx,
  totalQuestions,
  mode,
  isStudy,
  isOaBlitz,
  proctorWarnings,
  questionTimeLeft,
  isFlagged,
  toggleFlag,
  setShowExitModal,
  answers,
  toggleOption,
  isChecked,
  checkResult,
  showExplanation,
  aiExplanations,
  aiLoading,
  handleAiExplain,
  handlePrev,
  handleNext,
  handleAdvanceOaQuestion,
  handleCheck,
  goToReview,
  toast,
  isSecurityActive = false
}) {
  if (!currentQ) return null;
  const qId = currentQ.id || currentQ._id;
  const questionAnswer = (qId && answers[qId]) || [];

  return (
    <div className="card test-mobile-question-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Exam Content Security Guard for Escape loophole */}
      {isSecurityActive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(10, 10, 15, 0.96)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: '1rem' }}>
            <Lock size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Exam Protected</h3>
          <p style={{ maxWidth: '420px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            Question content is obscured while outside full-screen mode or while an exit confirmation is open to preserve exam integrity.
          </p>
        </div>
      )}

      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            Q{currentIdx + 1} <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>/ {totalQuestions}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {mode === 'simulation' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.3rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.12)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.18)',
                border: `1px solid ${proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.35)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`,
                color: proctorWarnings === 0 ? '#34d399' : proctorWarnings === 1 ? '#fbbf24' : '#f87171',
                letterSpacing: '0.02em',
              }}
              title="Simulation Proctoring: Tab switches or leaving full-screen are monitored (Max 3 warnings)"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
              <span>{proctorWarnings === 0 ? 'Proctor Active (0/3)' : `Warning ${proctorWarnings}/3`}</span>
            </div>
          )}
          {isOaBlitz && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.3rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: questionTimeLeft <= 10 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${questionTimeLeft <= 10 ? 'rgba(239, 68, 68, 0.45)' : 'var(--border-light)'}`,
                color: questionTimeLeft <= 10 ? '#f87171' : 'var(--text-primary)',
                letterSpacing: '0.02em',
              }}
            >
              <span>OA Blitz: {questionTimeLeft}s remaining</span>
            </div>
          )}
          <span
            className="badge"
            style={{
              backgroundColor: currentQ.type === 'MSQ' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: currentQ.type === 'MSQ' ? '#eab308' : '#818cf8',
              borderColor: currentQ.type === 'MSQ' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(99, 102, 241, 0.3)',
              fontWeight: 700,
            }}
          >
            {currentQ.type || 'MCQ'}
          </span>
          <span className="badge">{currentQ.module}</span>
          <button
            onClick={toggleFlag}
            className={`icon-btn ${isFlagged ? 'icon-btn-active' : ''}`}
            title="Flag for review"
            style={{ color: isFlagged ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowExitModal(true)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Exit full-screen exam"
          >
            <LogOut size={13} /> Exit Exam
          </button>
        </div>
      </div>

      {/* Main Question & Options Body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 500, marginBottom: '1.5rem' }}>
          {currentQ.scenario}
        </p>

        {currentQ.type === 'MSQ' && (
          <p style={{
            fontSize: '0.825rem',
            color: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>
              Select {currentQ.chooseCount
                ? `exactly ${currentQ.chooseCount} options`
                : 'all options that apply'} — multiple correct answers possible.
            </span>
          </p>
        )}

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentQ.options.map((opt, i) => {
            const isSelected = questionAnswer.includes(i);
            const isCorrectOption = isStudy && checkResult ? checkResult.correctAnswer.includes(i) : (currentQ.answer?.includes(i) || false);
            const isMSQ = currentQ.type === 'MSQ';

            let style = {
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem',
              border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: isChecked ? 'default' : 'pointer',
              backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
              transition: 'all 0.15s',
              color: 'var(--text-primary)',
            };

            if (isStudy && isChecked) {
              if (isCorrectOption) {
                style.borderColor = '#10b981';
                style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                style.color = '#34d399';
              } else if (isSelected) {
                style.borderColor = '#ef4444';
                style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                style.color = '#f87171';
              } else {
                style.opacity = 0.45;
                style.borderColor = 'var(--border-subtle)';
              }
            }

            return (
              <label
                key={`${qId || currentIdx}_opt_${i}`}
                style={style}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isChecked) toggleOption(i);
                }}
              >
                <div style={{
                  width: '22px', height: '22px',
                  borderRadius: isMSQ ? 'var(--radius-sm)' : '50%',
                  border: `2px solid ${
                    isStudy && isChecked
                      ? (isCorrectOption ? '#10b981' : isSelected ? '#ef4444' : 'var(--border-strong)')
                      : (isSelected ? 'var(--text-primary)' : 'var(--border-strong)')
                  }`,
                  backgroundColor: isStudy && isChecked && isCorrectOption ? 'rgba(16, 185, 129, 0.25)' : isStudy && isChecked && isSelected && !isCorrectOption ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isStudy && isChecked ? (
                    isCorrectOption ? (
                      <Check size={14} color="#10b981" />
                    ) : isSelected ? (
                      <X size={14} color="#ef4444" />
                    ) : null
                  ) : isSelected ? (
                    isMSQ
                      ? <Check size={14} />
                      : <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
                  ) : null}
                </div>
                <span style={{ fontWeight: isSelected ? 600 : 400, flex: 1 }}>{opt}</span>
                {isStudy && isChecked && isCorrectOption && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Check size={18} />
                    <span>Correct</span>
                  </div>
                )}
                {isStudy && isChecked && isSelected && !isCorrectOption && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                    <X size={18} />
                    <span>Incorrect</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>

        {/* Immediate Action Controls - Placed right near options: Prev -> Next -> Check Answer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          paddingTop: '1.25rem',
          marginTop: '1.25rem',
          borderTop: '1px solid var(--border-light)',
          flexWrap: 'wrap'
        }}>
          {/* 1. Previous Button */}
          {isOaBlitz ? (
            <button
              className="btn btn-secondary"
              onClick={() => toast.info('Backtracking is disabled in OA Blitz mode')}
              disabled={true}
              style={{ opacity: 0.45, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Lock size={14} /> Backtracking Disabled
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIdx === 0}>
              <ChevronLeft size={16} style={{ marginRight: '0.25rem' }} /> Previous
            </button>
          )}

          {/* 2. Next / Finish / Review Button */}
          {isOaBlitz ? (
            <button
              className="btn btn-primary"
              onClick={() => handleAdvanceOaQuestion(false)}
              style={{
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{currentIdx === totalQuestions - 1 ? 'Lock & Submit Exam' : 'Next'}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={currentIdx === totalQuestions - 1 ? goToReview : handleNext}
              style={{
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{currentIdx === totalQuestions - 1 ? (isStudy ? 'Finish' : 'Review') : 'Next'}</span>
              {currentIdx < totalQuestions - 1 && <ChevronRight size={16} />}
            </button>
          )}

          {/* 3. Check Answer Button (Study Mode) */}
          {isStudy && !isChecked && questionAnswer.length > 0 && (
            <button
              onClick={handleCheck}
              className="btn btn-primary"
              style={{
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              Check Answer
            </button>
          )}
        </div>

        {/* Study Mode Explanations & AI Tutor */}
        {isStudy && isChecked && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
            {showExplanation && checkResult?.explanation && checkResult.explanation !== 'Parsed from document.' && (
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '4px solid var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Reference Explanation
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {checkResult.explanation}
                </p>
              </div>
            )}

            {/* AI Explanation Area */}
            <div>
              {!aiExplanations[qId] ? (
                <button
                  onClick={handleAiExplain}
                  disabled={aiLoading}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    padding: '0.65rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={15} className="auth-spinner" />
                      <span>Generating AI Explanation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} style={{ color: '#a855f7' }} />
                      <span>Explain with AI</span>
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderLeft: '4px solid #a855f7',
                  borderRadius: 'var(--radius-md)',
                  animation: 'fadeIn 0.3s ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                      <Sparkles size={15} style={{ color: '#a855f7' }} />
                      AI Tutor Explanation
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '10px' }}>
                      AI Generated
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {aiExplanations[qId]}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
