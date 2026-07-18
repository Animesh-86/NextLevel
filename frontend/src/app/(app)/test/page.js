'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { BrainCircuit, Check, X, Clock, Play, Flag, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Upload, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [deleteExamId, setDeleteExamId] = useState(null);

  // Test state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [checked, setChecked] = useState(new Set());
  const [checkedResults, setCheckedResults] = useState({}); // stores correct answer/explanation for checked questions
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
        const res = await apiFetch('/api/exams');
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

  const handleDeleteExam = useCallback(async (examId) => {
    if (!examId || examId === 'all') return;
    setDeleteExamId(examId);
  }, []);

  const confirmDeleteExam = useCallback(async () => {
    const examId = deleteExamId;
    setDeleteExamId(null);
    if (!examId) return;
    
    try {
      const res = await apiFetch(`/api/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document deleted successfully');
        setExams(prev => prev.filter(e => (e.id || e._id) !== examId));
        if (selectedExam === examId) {
          setSelectedExam('all');
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  }, [deleteExamId, selectedExam, toast]);

  const toggleOption = useCallback((optIdx) => {
    if (!currentQ) return;
    const qId = currentQ.id || currentQ._id;

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

    const nextAnswers = { ...answers, [qId]: updated };
    setAnswers(nextAnswers);
    if (!isStudy) {
      localStorage.setItem(`test_answers_${selectedExam}`, JSON.stringify(nextAnswers));
    }
  }, [currentQ, isStudy, checked, answers, selectedExam]);

  const handleCheck = useCallback(async () => {
    const qId = currentQ?.id || currentQ?._id;
    if (!currentQ || checked.has(qId)) return;
    
    // If it's a temporary ID, validate locally (no backend sync)
    if (qId && qId.startsWith('temp_')) {
       const isCorrect = (answers[qId] || []).length === (currentQ.answer || []).length && (answers[qId] || []).every(a => currentQ.answer.includes(a));
       setCheckedResults(prev => ({ ...prev, [qId]: { isCorrect, correctAnswer: currentQ.answer, explanation: currentQ.explanation } }));
       setChecked(prev => new Set([...prev, qId]));
       setShowExplanation(true);
       return;
    }

    try {
      const res = await apiFetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, userAnswer: answers[qId] || [] })
      });
      const data = await res.json();
      if (data.success) {
        setCheckedResults(prev => ({ ...prev, [qId]: data.data }));
        setChecked(prev => new Set([...prev, qId]));
        setShowExplanation(true);
      } else {
        toast.error(data.error || 'Failed to check answer');
      }
    } catch (err) {
      toast.error('Failed to check answer');
    }
  }, [currentQ, checked, answers, toast]);

  const toggleFlag = useCallback(() => {
    if (!currentQ) return;
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(currentIdx)) {
        newFlagged.delete(currentIdx);
      } else {
        newFlagged.add(currentIdx);
      }
      return newFlagged;
    });
  }, [currentQ, currentIdx]);

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setShowExplanation(false);
    }
  }, [currentIdx, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setShowExplanation(false);
    }
  }, [currentIdx]);

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    return () => exitFullscreen();
  }, []);

  const goToReview = useCallback(() => {
    exitFullscreen();
    setPhase('review');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const timeTaken = (performance.now() - testStartTime) / 1000;
    
    // Clear auto-save
    localStorage.removeItem(`test_answers_${selectedExam}`);

    try {
      const res = await apiFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          timeTaken,
          userAnswers: answers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        exitFullscreen();
        const resultId = data.data?.id || data.data?._id || data?.id || data?._id;
        router.push(`/results/${resultId}`);
      } else {
        toast.error('Failed to save result');
        setSubmitting(false);
      }
    } catch (err) {
      toast.error('Failed to submit');
      setSubmitting(false);
    }
  }, [submitting, testStartTime, selectedExam, answers, router, toast]);

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
  }, [phase, isStudy, handleSubmit]);

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
  }, [phase, currentQ, currentIdx, questions, answers, handleNext, handlePrev, toggleFlag, toggleOption]);

  const handleUploadQuestions = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // UI state for loading
    const toastId = toast.loading(`Processing ${file.name}...`);
    e.target.value = '';
    
    const docTitle = file.name.replace(/\.[^/.]+$/, "");
    if (exams.some(e => e.title === docTitle)) {
      toast.error(`A document named "${docTitle}" already exists.`, { id: toastId });
      return;
    }

    try {
      let questionsArray = [];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // Handle JSON directly
        const text = await file.text();
        const json = JSON.parse(text);
        questionsArray = Array.isArray(json) ? json : [json];
      } else {
        // It's a PDF, DOCX, or TXT -> Extract text
        const formData = new FormData();
        formData.append('file', file);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });
        const extractData = await extractRes.json();

        if (!extractData.success) {
          throw new Error(extractData.error || 'Failed to extract text from document');
        }

        toast.loading(`Analyzing text with AI to generate questions...`, { id: toastId });

        // Generate questions via AI
        const genRes = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractData.text })
        });
        const genData = await genRes.json();

        if (!genData.success) {
          throw new Error(genData.error || 'Failed to generate questions');
        }

        questionsArray = genData.data;
      }

      if (!questionsArray || questionsArray.length === 0) {
        throw new Error('No questions could be extracted or generated from this file.');
      }

      toast.loading(`Creating document group...`, { id: toastId });
      
      // Create Exam group for this document
      const examRes = await apiFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           title: file.name.replace(/\.[^/.]+$/, ""),
           description: `Questions extracted from ${file.name}`,
           timeLimit: 60,
           isPublic: false
        })
      });
      const examData = await examRes.json();
      
      if (!examData.success) {
        throw new Error(examData.error || 'Failed to create document group');
      }
      const newExam = examData.data;

      // Assign examId to questions
      const questionsWithExam = questionsArray.map(q => ({ ...q, examId: newExam._id || newExam.id }));

      toast.loading(`Saving ${questionsWithExam.length} questions...`, { id: toastId });

      // Save to backend
      const res = await apiFetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionsWithExam)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully added ${questionsWithExam.length} questions from ${file.name}!`, { id: toastId });
        setExams(prev => [...prev, newExam]);
        setSelectedExam(newExam._id || newExam.id);
      } else {
        throw new Error(data.error || 'Failed to save questions');
      }

    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    }
  };

  async function startTest() {
    try {
      const endpoint = selectedExam && selectedExam !== 'all' 
        ? `/api/questions?limit=1000&examId=${selectedExam}` 
        : `/api/questions?limit=1000`;
      const res = await apiFetch(endpoint);
      const resData = await res.json();
      
      const questionList = resData.data?.data || resData.data || [];

      if (!resData.success || questionList.length === 0) {
        toast.error('No questions found to test');
        return;
      }

      // Ensure all questions have a unique ID, then shuffle
      const shuffled = questionList.map((q, i) => {
        if (!q.id && !q._id) {
          q._id = `temp_${Date.now()}_${i}`;
        }
        return q;
      }).sort(() => Math.random() - 0.5).slice(0, questionCount);
      
      setQuestions(shuffled);
      setCurrentIdx(0);
      setAnswers({});
      setFlagged(new Set());
      setChecked(new Set());
      const savedAnswers = localStorage.getItem(`test_answers_${selectedExam}`);
      if (savedAnswers && !isStudy) {
        try { setAnswers(JSON.parse(savedAnswers)); } catch (e) {}
      }

      setTimeLeft(timeMinutes * 60);
      setTestStartTime(performance.now());
      setPhase('testing');
      
      setTimeout(() => {
        const testElem = document.getElementById('test-container');
        if (testElem && testElem.requestFullscreen) {
          testElem.requestFullscreen().catch(() => {});
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }, 100);
    } catch (err) {
      toast.error('Failed to load questions');
    }
  }

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => (answers[q.id || q._id] || []).length > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const timerWarning = !isStudy && timeLeft < 300 && timeLeft > 0;
  const timerCritical = !isStudy && timeLeft < 60 && timeLeft > 0;

  // ─── CONFIG PHASE ───
  if (phase === 'config') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <ConfirmModal
          open={!!deleteExamId}
          onCancel={() => setDeleteExamId(null)}
          onConfirm={confirmDeleteExam}
          title="Delete this document?"
          message="This will permanently delete this document and all its questions. This action cannot be undone."
          confirmText="Delete Document"
        />
        {/* Glass Header Banner */}
        <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
              Assessment Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
              Configure your test parameters and document sources.
            </p>
          </div>
        </header>
        {/* Main Bento Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 'var(--space-md)' 
        }}>
          {/* Left Column: Configuration & Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Flag size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Session Mode</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setMode('simulation')} className={`btn ${mode === 'simulation' ? 'btn-primary' : ''}`} style={{ flex: 1, padding: '0.8rem', background: mode === 'simulation' ? 'var(--brand-primary)' : 'var(--bg-surface)', color: mode === 'simulation' ? 'var(--brand-inverse)' : 'var(--text-primary)', border: mode === 'simulation' ? 'none' : '1px solid var(--border-light)' }}>
                  Simulation
                </button>
                <button onClick={() => setMode('study')} className={`btn ${mode === 'study' ? 'btn-primary' : ''}`} style={{ flex: 1, padding: '0.8rem', background: mode === 'study' ? 'var(--brand-primary)' : 'var(--bg-surface)', color: mode === 'study' ? 'var(--brand-inverse)' : 'var(--text-primary)', border: mode === 'study' ? 'none' : '1px solid var(--border-light)' }}>
                  Study (SRS)
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '1rem' }}>
                {mode === 'simulation' ? 'Simulation mode runs a timed test mimicking a real exam environment.' : 'Study (SRS) mode uses Spaced Repetition System to help you memorize effectively, repeating harder questions more frequently.'}
              </p>
            </section>

            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Clock size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Parameters</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time (min)</label>
                  <input type="number" className="input" value={timeMinutes} onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 60)} disabled={isStudy} style={{ opacity: isStudy ? 0.5 : 1, fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</label>
                  <input type="number" className="input" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)} min={1} max={200} style={{ fontSize: '0.95rem' }} />
                </div>
              </div>

              <button onClick={startTest} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={configLoading}>
                <Play size={18} style={{ marginRight: '0.5rem' }} /> Begin {isStudy ? 'Study Session' : 'Assessment'}
              </button>
            </section>
          </div>

          {/* Right Column: Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrainCircuit size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Document Source</h2>
                </div>
                <label className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                  <Upload size={14} style={{ marginRight: '0.4rem' }} /> Upload
                  <input type="file" accept=".json,.pdf,.docx,.txt" onChange={handleUploadQuestions} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  className="select" 
                  value={selectedExam} 
                  onChange={(e) => setSelectedExam(e.target.value)}
                  style={{ width: '100%', fontSize: '0.95rem' }}
                >
                  <option value="all">Global Pool (All Questions)</option>
                  {exams.map(ex => (
                    <option key={ex._id || ex.id} value={ex._id || ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '1rem' }}>
                Select a document to test against, or test from your entire pool.
              </p>
            </section>

            <section className="glass-panel" style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document History</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exams.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No documents uploaded yet.</p>
                ) : (
                  exams.map(ex => (
                    <div key={ex._id || ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ex.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleDeleteExam(ex._id || ex.id)} className="icon-btn" title="Delete document" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
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
            <button className="btn btn-secondary" onClick={() => {
              setPhase('testing');
              setTimeout(() => {
                const testElem = document.getElementById('test-container');
                if (testElem && testElem.requestFullscreen) testElem.requestFullscreen().catch(() => {});
              }, 100);
            }} style={{ flex: 1 }}>Go Back</button>
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
  const qId = currentQ.id || currentQ._id;
  const questionAnswer = answers[qId] || [];
  const isChecked = checked.has(qId);
  const checkResult = checkedResults[qId];
  const isFlagged = flagged.has(currentIdx);

  return (
    <div id="test-container" style={{ display: 'flex', height: '100%', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out', backgroundColor: 'var(--bg-primary)', padding: '1.5rem', overflow: 'auto' }} className="test-layout">
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
              const isAnswered = (answers[q.id || q._id] || []).length > 0;
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
          {isStudy && isChecked && showExplanation && checkResult?.explanation && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderLeft: '4px solid var(--text-primary)', borderRadius: 'var(--radius-sm)', animation: 'fadeIn 0.2s' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Explanation</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{checkResult.explanation}</p>
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
