'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { BrainCircuit, Check, X, Clock, Play, Flag, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function FocusTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Config state
  const [phase, setPhase] = useState('config'); // config | testing | review | finished
  const [mode, setMode] = useState(searchParams.get('mode') === 'study' ? 'study' : 'simulation');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [configLoading, setConfigLoading] = useState(true);

  // Test state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [checked, setChecked] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef(null);

  const isStudy = mode === 'study';
  const currentQ = questions[currentIdx];

  // Fetch exams on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/exams');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          setSelectedExam(data.data[0]._id);
          setTimeMinutes(data.data[0].timeLimit || 60);
        }
      } catch (err) {
        toast.error('Failed to load exams');
      }
      setConfigLoading(false);
    }
    load();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'testing' || isStudy) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, isStudy]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'testing') return;

    function handleKeyDown(e) {
      if (e.key === 'ArrowRight' || e.key === 'n') handleNext();
      else if (e.key === 'ArrowLeft' || e.key === 'p') handlePrev();
      else if (e.key === 'f') toggleFlag();
      else if (e.key >= '1' && e.key <= '9') {
        const optIdx = parseInt(e.key) - 1;
        if (currentQ && optIdx < currentQ.options.length) toggleOption(optIdx);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentIdx, questions, answers]);

  async function startTest() {
    if (!selectedExam) { toast.error('Select an exam'); return; }

    try {
      const res = await fetch(`/api/questions?examId=${selectedExam}&limit=${questionCount}`);
      const data = await res.json();

      if (!data.success || data.data.length === 0) {
        toast.error('No questions found for this exam');
        return;
      }

      // Shuffle questions
      const shuffled = data.data.sort(() => Math.random() - 0.5).slice(0, questionCount);
      setQuestions(shuffled);
      setCurrentIdx(0);
      setAnswers({});
      setFlagged(new Set());
      setChecked(new Set());
      setTimeLeft(timeMinutes * 60);
      setTestStartTime(Date.now());
      setPhase('testing');
    } catch (err) {
      toast.error('Failed to load questions');
    }
  }

  function toggleOption(optIdx) {
    if (!currentQ) return;
    const qId = currentQ._id;

    // Don't allow changes after checking in study mode
    if (isStudy && checked.has(qId)) return;

    const current = answers[qId] || [];
    const isMSQ = currentQ.type === 'MSQ';

    let updated;
    if (isMSQ) {
      updated = current.includes(optIdx)
        ? current.filter(a => a !== optIdx)
        : [...current, optIdx];
    } else {
      updated = current.includes(optIdx) ? [] : [optIdx];
    }

    setAnswers({ ...answers, [qId]: updated });
  }

  function handleCheck() {
    if (!currentQ) return;
    setChecked(new Set([...checked, currentQ._id]));
    setShowExplanation(true);
  }

  function toggleFlag() {
    if (!currentQ) return;
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentIdx)) {
      newFlagged.delete(currentIdx);
    } else {
      newFlagged.add(currentIdx);
    }
    setFlagged(newFlagged);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowExplanation(false);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setShowExplanation(false);
    }
  }

  function goToReview() {
    setPhase('review');
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const timeTaken = Math.round((Date.now() - testStartTime) / 1000);
    let correct = 0, wrong = 0, skipped = 0;

    const userAnswerMap = {};
    for (const q of questions) {
      const ua = answers[q._id] || [];
      userAnswerMap[q._id] = ua;

      if (ua.length === 0) {
        skipped++;
      } else {
        const isCorrect = ua.length === q.answer.length && ua.every(a => q.answer.includes(a));
        if (isCorrect) correct++;
        else wrong++;
      }
    }

    const totalCount = questions.length;
    const scorePercent = Math.round((correct / totalCount) * 100);
    const exam = exams.find(e => e._id === selectedExam);
    const passed = scorePercent >= (exam?.passPercentage || 75);

    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          scorePercent,
          correctCount: correct,
          wrongCount: wrong,
          skippedCount: skipped,
          totalCount,
          passed,
          timeTaken,
          userAnswers: userAnswerMap,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/results/${data.data._id}`);
      } else {
        toast.error('Failed to save result');
        setSubmitting(false);
      }
    } catch (err) {
      toast.error('Failed to submit');
      setSubmitting(false);
    }
  }, [answers, questions, selectedExam, testStartTime, exams, submitting, router, toast]);

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => (answers[q._id] || []).length > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const timerWarning = !isStudy && timeLeft < 300 && timeLeft > 0;
  const timerCritical = !isStudy && timeLeft < 60 && timeLeft > 0;

  // ─── CONFIG PHASE ───
  if (phase === 'config') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Configure Session</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Set up your assessment parameters.</p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setMode('simulation')} className={`btn ${mode === 'simulation' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.875rem' }}>
                Simulation
              </button>
              <button onClick={() => setMode('study')} className={`btn ${mode === 'study' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.875rem' }}>
                Study (SRS)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Exam</label>
            <select className="select" value={selectedExam} onChange={(e) => {
              setSelectedExam(e.target.value);
              const exam = exams.find(ex => ex._id === e.target.value);
              if (exam) setTimeMinutes(exam.timeLimit || 60);
            }}>
              {configLoading ? <option>Loading...</option> : exams.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.title} ({ex.questionCount || 0} Qs)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Time (min)</label>
              <input type="number" className="input" value={timeMinutes} onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 60)} disabled={isStudy} style={{ opacity: isStudy ? 0.5 : 1 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Questions</label>
              <input type="number" className="input" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)} min={1} max={200} />
            </div>
          </div>

          <button onClick={startTest} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={!selectedExam || configLoading}>
            <Play size={18} style={{ marginRight: '0.5rem' }} /> Begin {isStudy ? 'Study Session' : 'Assessment'}
          </button>
        </div>
      </div>
    );
  }

  // ─── REVIEW PHASE ───
  if (phase === 'review') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', animation: 'fadeIn 0.3s ease-out' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Submit Exam?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{answeredCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Answered</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{unansweredCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unanswered</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{flagged.size}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flagged</div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--warning)' }}>
              <AlertTriangle size={16} /> You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setPhase('testing')} style={{ flex: 1 }}>Go Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1 }} disabled={submitting}>
              {submitting ? <Loader2 size={18} className="auth-spinner" /> : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TESTING PHASE ───
  if (!currentQ) return null;
  const questionAnswer = answers[currentQ._id] || [];
  const isChecked = checked.has(currentQ._id);
  const isFlagged = flagged.has(currentIdx);

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }} className="test-layout">
      {/* Left Panel */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }} className="test-sidebar">
        {/* Timer */}
        <div className="card" style={{ textAlign: 'center', borderColor: timerCritical ? 'var(--text-primary)' : timerWarning ? 'var(--warning)' : 'var(--border-strong)' }}>
          <div style={{
            fontSize: '2.25rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.05em',
            animation: timerCritical ? 'pulseBorder 1s infinite' : 'none',
          }}>
            {isStudy ? '∞' : formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{isStudy ? 'Study Mode' : 'Time Remaining'}
          </div>
          {!isStudy && (
            <div style={{ marginTop: '0.75rem', height: '4px', backgroundColor: 'var(--bg-accent)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / (timeMinutes * 60)) * 100}%`,
                backgroundColor: timerCritical ? 'var(--warning)' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s linear',
              }} />
            </div>
          )}
        </div>

        {/* Navigator */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigator</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
            {questions.map((q, i) => {
              const isAnswered = (answers[q._id] || []).length > 0;
              const isCurrent = i === currentIdx;
              const isFlag = flagged.has(i);

              return (
                <button
                  key={i}
                  onClick={() => { setCurrentIdx(i); setShowExplanation(false); }}
                  title={`Q${i + 1}${isFlag ? ' (flagged)' : ''}${isAnswered ? ' (answered)' : ''}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isCurrent ? 'var(--text-primary)' : isFlag ? 'var(--warning)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: isCurrent ? 'var(--text-primary)' : isAnswered ? 'var(--bg-accent)' : 'transparent',
                    color: isCurrent ? 'var(--bg-primary)' : 'var(--text-primary)',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {i + 1}
                  {isFlag && <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', backgroundColor: 'var(--warning)', borderRadius: '50%' }} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {answeredCount}/{questions.length} answered
          </div>
        </div>

        <button className="btn btn-secondary" onClick={goToReview} style={{ color: 'var(--text-muted)' }}>
          {isStudy ? 'End Session' : 'Review & Submit'}
        </button>
      </div>

      {/* Main Question Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Q{currentIdx + 1} <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>/ {questions.length}</span></span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge">{currentQ.type}</span>
            <span className="badge">{currentQ.module}</span>
            <button
              onClick={toggleFlag}
              className={`icon-btn ${isFlagged ? 'icon-btn-active' : ''}`}
              title="Flag for review"
              style={{ color: isFlagged ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 500, marginBottom: '1.5rem' }}>{currentQ.scenario}</p>

          {currentQ.type === 'MSQ' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
              Select {currentQ.chooseCount || 'all that'} apply — multiple answers possible.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = questionAnswer.includes(i);
              const isCorrectOption = currentQ.answer.includes(i);
              const isMSQ = currentQ.type === 'MSQ';

              let style = {
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.25rem',
                border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: isChecked ? 'default' : 'pointer',
                backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                transition: 'all 0.15s',
              };

              if (isStudy && isChecked) {
                if (isCorrectOption) {
                  style.borderColor = 'var(--text-primary)';
                  style.backgroundColor = 'var(--bg-accent)';
                } else if (isSelected) {
                  style.opacity = 0.5;
                } else {
                  style.opacity = 0.5;
                }
              }

              return (
                <label key={i} style={style} onClick={() => toggleOption(i)}>
                  <div style={{
                    width: '22px', height: '22px',
                    borderRadius: isMSQ ? 'var(--radius-sm)' : '50%',
                    border: `2px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && (
                      isMSQ
                        ? <Check size={14} />
                        : <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
                    )}
                  </div>
                  <span style={{ fontWeight: isSelected ? 600 : 400, flex: 1 }}>{opt}</span>
                  {isStudy && isChecked && isCorrectOption && <Check size={18} />}
                  {isStudy && isChecked && isSelected && !isCorrectOption && <X size={18} style={{ color: 'var(--text-muted)' }} />}
                </label>
              );
            })}
          </div>

          {/* Explanation */}
          {isStudy && isChecked && showExplanation && currentQ.explanation && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderLeft: '4px solid var(--text-primary)', borderRadius: 'var(--radius-sm)', animation: 'fadeIn 0.2s' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Explanation</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIdx === 0}>
            <ChevronLeft size={16} style={{ marginRight: '0.25rem' }} /> Previous
          </button>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isStudy && !isChecked && questionAnswer.length > 0 && (
              <button onClick={handleCheck} className="btn btn-primary" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                Check Answer
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={currentIdx === questions.length - 1 ? goToReview : handleNext}
            >
              {currentIdx === questions.length - 1 ? (isStudy ? 'Finish' : 'Review') : 'Next'}
              {currentIdx < questions.length - 1 && <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
