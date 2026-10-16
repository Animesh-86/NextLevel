'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { BrainCircuit, Check, X, Clock, Play, Flag, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Upload, Trash2, ClipboardPaste, Info, ChevronDown, FileText, Download, Search, Sparkles, Trophy, CalendarDays, LogOut, ShieldAlert, Zap, Lock, Volume2, VolumeX, ListFilter, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { extractQuestionsFromJson, isMSQQuestion } from '@/lib/questionParser';
import ExamResultsHistory from '@/components/ExamResultsHistory';
import ScheduleTaskModal from '@/components/ScheduleTaskModal';
import AssessmentPreloader from '@/components/AssessmentPreloader';
import PerQuestionTimer from '@/components/PerQuestionTimer';

// Zero-dependency audio synthesizers for OA Blitz mode cues
const playTickSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
};

const playTimeoutChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

export default function FocusTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Config state
  const [phase, setPhase] = useState('config'); // config | testing | review | finished
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'results' ? 'results' : 'test');
  const [mode, setMode] = useState(searchParams.get('mode') === 'study' ? 'study' : searchParams.get('mode') === 'oa_blitz' ? 'oa_blitz' : 'simulation');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(60); // 30, 45, 60, 90, 120, 180
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState(['all']);
  const [historySearch, setHistorySearch] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [configLoading, setConfigLoading] = useState(true);
  const [deleteExamId, setDeleteExamId] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteProcessing, setPasteProcessing] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // { file, suggestedName }
  const [uploadName, setUploadName] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef(null);

  // Preloader & Scheduling State
  const [showPreloader, setShowPreloader] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Proctoring & Fullscreen Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const lastInfractionTimeRef = useRef(0);

  // Keep activeTab in sync with query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'results') {
      setActiveTab('results');
    } else if (tab === 'test') {
      setActiveTab('test');
    }
  }, [searchParams]);

  // Test state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [checked, setChecked] = useState(new Set());
  const [checkedResults, setCheckedResults] = useState({}); // stores correct answer/explanation for checked questions
  const [aiExplanations, setAiExplanations] = useState({}); // stores { [qId]: explanation }
  const [aiLoading, setAiLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef(null);

  // OA Blitz State
  const [questionTimeLeft, setQuestionTimeLeft] = useState(perQuestionSeconds);
  const [questionTimeMap, setQuestionTimeMap] = useState({});
  const [timedOutQuestions, setTimedOutQuestions] = useState(new Set());
  const [lockedQuestions, setLockedQuestions] = useState(new Set());
  const advancingOaRef = useRef(false);
  const [showMobileNavigator, setShowMobileNavigator] = useState(false);

  const isStudy = mode === 'study';
  const isOaBlitz = mode === 'oa_blitz';
  const currentQ = questions[currentIdx];

  // Close source dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target)) {
        setSourceDropdownOpen(false);
      }
    }
    if (sourceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sourceDropdownOpen]);

  // Fetch exams on mount & listen for updates from room/sprints
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/exams');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          const firstId = data.data[0].id || data.data[0]._id;
          setSelectedExams(prev => {
            if (prev.length === 0 || (prev.length === 1 && prev[0] === 'all')) {
              return firstId ? [firstId] : ['all'];
            }
            return prev;
          });
          setTimeMinutes(prev => prev || data.data[0].timeLimit || 60);
        }
      } catch (err) {
        toast.error('Failed to load exams');
      }
      setConfigLoading(false);
    }
    load();

    const handleVaultSync = () => {
      load();
    };
    window.addEventListener('vault-updated', handleVaultSync);
    window.addEventListener('storage', handleVaultSync);
    return () => {
      window.removeEventListener('vault-updated', handleVaultSync);
      window.removeEventListener('storage', handleVaultSync);
    };
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
        if (selectedExams.includes(examId)) {
          setSelectedExams(prev => prev.filter(id => id !== examId).length ? prev.filter(id => id !== examId) : ['all']);
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  }, [deleteExamId, selectedExams, toast]);

  const toggleOption = useCallback((optIdx) => {
    if (!currentQ) return;
    const qId = currentQ.id || currentQ._id;

    // Don't allow changes after checking in study mode or if locked in OA Blitz
    if (isStudy && checked.has(qId)) return;
    if (isOaBlitz && lockedQuestions.has(currentIdx)) return;

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
    if (!isStudy && !isOaBlitz) {
      localStorage.setItem(`test_answers_${selectedExams.join(',')}`, JSON.stringify(nextAnswers));
    }
  }, [currentQ, currentIdx, isStudy, isOaBlitz, lockedQuestions, checked, answers, selectedExams]);

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

  const handleAiExplain = useCallback(async () => {
    if (!currentQ || aiLoading) return;
    const qId = currentQ.id || currentQ._id;
    if (aiExplanations[qId]) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: currentQ.scenario,
          options: currentQ.options,
          userAnswer: answers[qId] || [],
          correctAnswer: checkedResults[qId]?.correctAnswer || currentQ.answer || [],
          type: currentQ.type || 'MCQ',
          existingExplanation: checkedResults[qId]?.explanation || currentQ.explanation || '',
        }),
      });

      const data = await res.json();
      if (data.success && data.explanation) {
        setAiExplanations(prev => ({ ...prev, [qId]: data.explanation }));
      } else {
        toast.error(data.error || 'Failed to generate explanation');
      }
    } catch (err) {
      console.error('AI Explain error:', err);
      toast.error('Failed to generate AI explanation');
    } finally {
      setAiLoading(false);
    }
  }, [currentQ, aiLoading, aiExplanations, answers, checkedResults, toast]);

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

  const handleSubmit = useCallback(async (customOverrides = {}) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const timeTaken = (performance.now() - testStartTime) / 1000;
    
    // Clear auto-save
    localStorage.removeItem(`test_answers_${selectedExams.join(',')}`);

    const finalTimeMap = customOverrides.questionTimeTaken || questionTimeMap;
    const finalTimedOut = customOverrides.timedOutQuestions 
      ? Array.from(customOverrides.timedOutQuestions) 
      : Array.from(timedOutQuestions);

    try {
      const res = await apiFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExams.includes('all') ? 'all' : selectedExams.join(','),
          questionIds: questions.map(q => q.id || q._id),
          timeTaken,
          userAnswers: answers,
          testMode: mode,
          perQuestionTimeLimitSeconds: isOaBlitz ? perQuestionSeconds : null,
          questionTimeTaken: isOaBlitz ? finalTimeMap : null,
          timedOutQuestionIds: isOaBlitz ? finalTimedOut : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        exitFullscreen();
        const resultId = data.data?.id || data.data?._id || data?.id || data?._id;
        router.push(`/results/${resultId}`);
      } else {
        toast.error(data.message || data.error || 'Failed to save result');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit');
      setSubmitting(false);
    }
  }, [submitting, testStartTime, selectedExams, answers, mode, isOaBlitz, perQuestionSeconds, questionTimeMap, timedOutQuestions, router, toast]);

  // Advance or Auto-lock question in OA Blitz mode
  const handleAdvanceOaQuestion = useCallback((isTimeout = false) => {
    if (!currentQ || submitting || advancingOaRef.current) return;
    advancingOaRef.current = true;
    setTimeout(() => {
      advancingOaRef.current = false;
    }, 600);

    const qId = currentQ.id || currentQ._id;
    const timeSpent = isTimeout ? perQuestionSeconds : Math.max(1, perQuestionSeconds - questionTimeLeft);

    const updatedTimeMap = { ...questionTimeMap, [qId]: timeSpent };
    setQuestionTimeMap(updatedTimeMap);
    setLockedQuestions(prev => new Set([...prev, currentIdx]));

    let updatedTimedOut = timedOutQuestions;
    if (isTimeout) {
      updatedTimedOut = new Set([...timedOutQuestions, qId]);
      setTimedOutQuestions(updatedTimedOut);
      if (soundEnabled) playTimeoutChime();
      toast.info('Time limit expired for this question! Auto-advancing.');
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setQuestionTimeLeft(perQuestionSeconds);
      setShowExplanation(false);
    } else {
      handleSubmit({
        questionTimeTaken: updatedTimeMap,
        timedOutQuestions: updatedTimedOut
      });
    }
  }, [currentQ, currentIdx, questions, perQuestionSeconds, questionTimeLeft, soundEnabled, timedOutQuestions, questionTimeMap, submitting, handleSubmit, toast]);

  // Handle Proctor Infraction in Simulation Mode
  const handleInfraction = useCallback((reason) => {
    if (mode !== 'simulation' || phase !== 'testing' || submitting) return;
    const now = Date.now();
    if (now - lastInfractionTimeRef.current < 3000) return; // Debounce 3s
    lastInfractionTimeRef.current = now;

    setProctorWarnings((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        toast.error(`🚫 Exam Auto-Submitted: 3 proctoring infractions reached (${reason}).`);
        handleSubmit();
        return 3;
      } else if (next === 2) {
        toast.warning(`⚠️ FINAL PROCTOR WARNING (2 of 3): ${reason}! Next infraction will automatically submit your exam.`);
      } else {
        toast.warning(`⚠️ Proctor Warning (1 of 3): ${reason}! Please remain focused on the exam.`);
      }
      return next;
    });
  }, [mode, phase, submitting, handleSubmit, toast]);

  // Monitor Tab Switch & Application Blur in Simulation Mode
  useEffect(() => {
    if (mode !== 'simulation' || phase !== 'testing' || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInfraction('Switched browser tab or minimized window');
      }
    };

    const handleBlur = () => {
      handleInfraction('Window blur / switched application');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [mode, phase, submitting, handleInfraction]);

  // Monitor Full-Screen changes & Escape key
  useEffect(() => {
    if (phase !== 'testing' || submitting) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement;
      if (!isCurrentlyFull && phase === 'testing' && !submitting) {
        setShowExitModal(true);
        if (mode === 'simulation') {
          handleInfraction('Exited full-screen exam mode');
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitModal(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, submitting, mode, handleInfraction]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
    setTimeout(() => {
      const testElem = document.getElementById('test-container');
      if (testElem && testElem.requestFullscreen) {
        testElem.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }, 100);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    exitFullscreen();
    clearInterval(timerRef.current);
    setPhase('config');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setProctorWarnings(0);
    setQuestionTimeMap({});
    setTimedOutQuestions(new Set());
    setLockedQuestions(new Set());
    setShowMobileNavigator(false);
    toast.info('Exam session exited.');
  }, [toast]);

  // Overall Exam Timer
  useEffect(() => {
    if (phase !== 'testing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (isStudy) {
            toast.info('Study session time limit reached!');
            goToReview();
          } else {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, isStudy, handleSubmit, goToReview, toast]);

  // Per-Question Countdown Timer in OA Blitz mode
  useEffect(() => {
    if (phase !== 'testing' || !isOaBlitz) return;

    const qInterval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 6 && prev > 1 && soundEnabled) {
          playTickSound();
        }
        if (prev <= 1) {
          setTimeout(() => {
            handleAdvanceOaQuestion(true);
          }, 0);
          return perQuestionSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qInterval);
  }, [phase, isOaBlitz, soundEnabled, perQuestionSeconds, handleAdvanceOaQuestion]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'testing') return;

    function handleKeyDown(e) {
      if (e.key === 'ArrowRight' || e.key === 'n') {
        if (isOaBlitz) {
          handleAdvanceOaQuestion(false);
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'p') {
        if (isOaBlitz) {
          toast.info('Backtracking is disabled in OA Blitz mode');
        } else {
          handlePrev();
        }
      } else if (e.key === 'f') {
        toggleFlag();
      } else if (e.key >= '1' && e.key <= '9') {
        const optIdx = parseInt(e.key) - 1;
        if (currentQ && optIdx < currentQ.options.length) toggleOption(optIdx);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isOaBlitz, currentQ, currentIdx, questions, answers, handleNext, handlePrev, handleAdvanceOaQuestion, toggleFlag, toggleOption, toast]);

  // Shared function to save parsed questions to backend (supports both MCQs and MSQs)
  const saveQuestionsToBackend = async (questionsArray, title, toastId) => {
    if (!questionsArray || questionsArray.length === 0) {
      throw new Error('No questions could be extracted or generated.');
    }

    toast.loading(`Creating document group...`, { id: toastId });
    
    const examRes = await apiFetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         title,
         description: `Questions from ${title}`,
         timeLimit: 60,
         isPublic: false
      })
    });
    const examData = await examRes.json();
    
    if (!examData.success) {
      throw new Error(examData.error || 'Failed to create document group');
    }
    const newExam = examData.data;

    const questionsWithExam = questionsArray.map(q => ({ ...q, examId: newExam._id || newExam.id }));

    toast.loading(`Saving ${questionsWithExam.length} questions...`, { id: toastId });

    const res = await apiFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionsWithExam)
    });
    const data = await res.json();
    
    if (data.success) {
      toast.success(`Successfully added ${questionsWithExam.length} questions!`, { id: toastId });
      const examWithCount = {
        ...newExam,
        questionCount: questionsWithExam.length,
        totalQuestions: questionsWithExam.length
      };
      setExams(prev => [examWithCount, ...prev]);
      setSelectedExams([newExam._id || newExam.id]);

      // Broadcast update so other tabs / study room modals sync immediately
      try {
        window.dispatchEvent(new CustomEvent('vault-updated', { detail: { exam: examWithCount } }));
        localStorage.setItem('vault_last_updated', Date.now().toString());
      } catch (e) {}
    } else {
      throw new Error(data.error || 'Failed to save questions');
    }
  };

  const handleUploadQuestions = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    
    const suggestedName = file.name.replace(/\.[^/.]+$/, "");
    setPendingUpload({ file });
    setUploadName(suggestedName);
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;
    const { file } = pendingUpload;
    const docTitle = uploadName.trim() || file.name.replace(/\.[^/.]+$/, "");
    
    if (exams.some(e => e.title === docTitle)) {
      toast.error(`A document named "${docTitle}" already exists.`);
      return;
    }

    setPendingUpload(null);
    setUploadName('');
    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
      let questionsArray = [];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        questionsArray = extractQuestionsFromJson(json);
        if (questionsArray.length === 0) {
          throw new Error('No valid questions found in the JSON file. Ensure questions have a scenario/question prompt and options.');
        }
      } else {
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

        toast.loading(`Analyzing questions with AI...`, { id: toastId });

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

      await saveQuestionsToBackend(questionsArray, docTitle, toastId);
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;

    // Fast path: if the user pasted raw JSON, parse all questions directly!
    try {
      const parsedJson = JSON.parse(pasteText.trim());
      const questions = extractQuestionsFromJson(parsedJson);
      
      if (questions && questions.length > 0) {
        setPasteProcessing(true);
        const toastId = toast.loading(`Saving ${questions.length} pasted questions...`);
        
        const title = pasteTitle.trim() || `Pasted JSON ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        await saveQuestionsToBackend(questions, title, toastId);
        setShowPasteModal(false);
        setPasteText('');
        setPasteTitle('');
        setPasteProcessing(false);
        return;
      }
    } catch (e) {
      // Not JSON, continue to AI extraction
    }

    setPasteProcessing(true);
    const toastId = toast.loading('Analyzing pasted questions with AI...');

    try {
      const genRes = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      const genData = await genRes.json();

      if (!genData.success) {
        throw new Error(genData.error || 'Failed to parse questions');
      }

      const title = pasteTitle.trim() || `Pasted ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      await saveQuestionsToBackend(genData.data, title, toastId);
      setShowPasteModal(false);
      setPasteText('');
      setPasteTitle('');
    } catch (err) {
      toast.error(err.message || 'Failed to process pasted questions', { id: toastId });
    } finally {
      setPasteProcessing(false);
    }
  };

  const finishStartTest = useCallback(() => {
    setShowPreloader(false);
    if (!pendingQuestions || pendingQuestions.length === 0) return;

    setQuestions(pendingQuestions);
    setCurrentIdx(0);
    setAnswers({});
    setFlagged(new Set());
    setChecked(new Set());
    setCheckedResults({});
    setAiExplanations({});
    setAiLoading(false);
    setProctorWarnings(0);
    lastInfractionTimeRef.current = 0;
    setShowExitModal(false);
    setQuestionTimeMap({});
    setTimedOutQuestions(new Set());
    setLockedQuestions(new Set());
    setQuestionTimeLeft(perQuestionSeconds);
    setShowMobileNavigator(false);

    const savedAnswers = localStorage.getItem(`test_answers_${selectedExams.join(',')}`);
    if (savedAnswers && !isStudy && !isOaBlitz) {
      try { setAnswers(JSON.parse(savedAnswers)); } catch (e) {}
    }

    const calculatedTotalSeconds = isOaBlitz
      ? pendingQuestions.length * perQuestionSeconds
      : timeMinutes * 60;

    setTimeLeft(calculatedTotalSeconds);
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
  }, [pendingQuestions, selectedExams, isStudy, isOaBlitz, perQuestionSeconds, timeMinutes]);

  async function startTest() {
    try {
      const validExamIds = selectedExams.filter(id => id && id !== 'all' && id !== 'undefined');
      const endpoint = validExamIds.length > 0 
        ? `/api/questions?limit=1000&examId=${validExamIds.join(',')}` 
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
      
      setPendingQuestions(shuffled);
      setShowPreloader(true);
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
  const timerWarning = timeLeft < 300 && timeLeft > 0;
  const timerCritical = timeLeft < 60 && timeLeft > 0;

  // ─── CONFIG PHASE ───
  if (phase === 'config') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Kinetic Typography Assessment Preloader */}
        <AssessmentPreloader
          active={showPreloader}
          onComplete={finishStartTest}
        />

        {/* Schedule Exam in Planner Modal */}
        <ScheduleTaskModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          defaultTitle={`Practice Exam: ${selectedExams.includes('all') ? 'Global Question Bank' : (exams.find(e => (e.id || e._id) === selectedExams[0])?.title || 'Custom Test')}`}
          defaultDescription={`Timed assessment practice session (${questionCount} questions, ${timeMinutes} minutes).`}
          defaultCategory="practice-exam"
          defaultDuration={timeMinutes}
        />

        <ConfirmModal
          open={!!deleteExamId}
          onCancel={() => setDeleteExamId(null)}
          onConfirm={confirmDeleteExam}
          title="Delete this document?"
          message="This will permanently delete this document and all its questions. This action cannot be undone."
          confirmText="Delete Document"
        />

        {/* Glass Header Banner with Integrated Tabs */}
        <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
                Assessment Hub
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
                {activeTab === 'test' 
                  ? 'Configure your test parameters, load documents, or schedule an exam.'
                  : 'Review your full exam performance history, pass rates, and detailed scorecards.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('test'); router.push('/test', { scroll: false }); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'test' ? '#fafafa' : 'transparent',
                  color: activeTab === 'test' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                  boxShadow: activeTab === 'test' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={15} style={{ fill: activeTab === 'test' ? '#09090b' : 'none', color: activeTab === 'test' ? '#09090b' : 'currentColor' }} /> Practice Exam
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('results'); router.push('/test?tab=results', { scroll: false }); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'results' ? '#fafafa' : 'transparent',
                  color: activeTab === 'results' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                  boxShadow: activeTab === 'results' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Trophy size={15} style={{ color: activeTab === 'results' ? '#09090b' : 'currentColor' }} /> Exam Results & History
              </button>
            </div>
          </div>
        </header>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === 'results' ? (
          <ExamResultsHistory onTakeTest={() => { setActiveTab('test'); router.push('/test', { scroll: false }); }} />
        ) : (
          <>
            {/* Row 1: Session Mode + Parameters side by side */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: 'var(--space-md)' 
            }}>
              {/* Session Mode */}
              <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <Flag size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Session Mode</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setMode('simulation')}
                    className={`btn ${mode === 'simulation' ? 'btn-primary' : ''}`}
                    style={{
                      padding: '0.8rem 0.5rem',
                      background: mode === 'simulation' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: mode === 'simulation' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                      border: mode === 'simulation' ? 'none' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Simulation</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Full Exam Timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('oa_blitz')}
                    className={`btn ${mode === 'oa_blitz' ? 'btn-primary' : ''}`}
                    style={{
                      padding: '0.8rem 0.5rem',
                      background: mode === 'oa_blitz' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: mode === 'oa_blitz' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                      border: mode === 'oa_blitz' ? 'none' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>OA Blitz</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Timed Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('study')}
                    className={`btn ${mode === 'study' ? 'btn-primary' : ''}`}
                    style={{
                      padding: '0.8rem 0.5rem',
                      background: mode === 'study' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: mode === 'study' ? 'var(--brand-inverse)' : 'var(--text-primary)',
                      border: mode === 'study' ? 'none' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Study (SRS)</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>Instant Feedback</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '1rem' }}>
                  {mode === 'oa_blitz'
                    ? 'OA Blitz Mode: Mimics corporate online assessments (AMCAT, Mercer Mettl, HackerRank). Each question has a strict countdown timer and auto-locks on timeout. Backtracking is disabled!'
                    : mode === 'simulation'
                    ? 'Simulation mode runs a timed test mimicking a real exam environment with tab infraction proctoring.'
                    : 'Study (SRS) mode uses Spaced Repetition System to help you memorize effectively, repeating harder questions more frequently.'}
                </p>
              </section>

              {/* Parameters */}
              <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <Clock size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Parameters</h2>
                </div>

                {isOaBlitz ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Timer Per Question
                        </label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {perQuestionSeconds >= 60 ? `${(perQuestionSeconds / 60).toFixed(1).replace('.0', '')} min / question` : `${perQuestionSeconds} sec / question`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[30, 45, 60, 90, 120, 180].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setPerQuestionSeconds(sec)}
                            style={{
                              flex: 1,
                              minWidth: '50px',
                              padding: '0.5rem 0.25rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: perQuestionSeconds === sec ? '1px solid var(--text-primary)' : '1px solid var(--border-light)',
                              background: perQuestionSeconds === sec ? 'var(--text-primary)' : 'var(--bg-surface)',
                              color: perQuestionSeconds === sec ? 'var(--bg-primary)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Questions
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                          max={200}
                          style={{ fontSize: '0.95rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total Est. Time
                        </label>
                        <div style={{
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 1rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)'
                        }}>
                          ~{Math.ceil((questionCount * perQuestionSeconds) / 60)} minutes
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {soundEnabled ? <Volume2 size={15} style={{ color: 'var(--text-primary)' }} /> : <VolumeX size={15} />}
                        <span>Audio Tick in Final 5 Seconds</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(prev => !prev)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: soundEnabled ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: soundEnabled ? 'var(--bg-primary)' : 'var(--text-muted)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {soundEnabled ? 'Enabled' : 'Muted'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time (min)</label>
                      <input type="number" className="input" value={timeMinutes} onChange={(e) => setTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={360} style={{ fontSize: '0.95rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</label>
                      <input type="number" className="input" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)} min={1} max={200} style={{ fontSize: '0.95rem' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={startTest}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '0.9rem',
                      fontSize: '1rem',
                    }}
                    disabled={configLoading}
                  >
                    <Play size={18} style={{ marginRight: '0.5rem' }} />
                    Begin {isOaBlitz ? 'OA Blitz' : isStudy ? 'Study Session' : 'Assessment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0.9rem 1.15rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Schedule this exam in Planner"
                  >
                    <CalendarDays size={18} /> Schedule
                  </button>
                </div>
              </section>
            </div>

        {/* Row 2: Document Source (full width) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 'var(--space-md)' 
        }}>
          <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Document Source</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowPasteModal(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <ClipboardPaste size={14} style={{ marginRight: '0.4rem' }} /> Paste
                </button>
                <label className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                  <Upload size={14} style={{ marginRight: '0.4rem' }} /> Upload
                  <input type="file" accept=".json,.pdf,.docx,.txt,.csv" onChange={handleUploadQuestions} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload a file or paste questions.
              </p>
              <span style={{ color: 'var(--border-strong)', fontSize: '0.75rem' }}>•</span>
              <button
                onClick={() => setShowFormatGuide(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--brand-primary, #818cf8)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0', fontWeight: 500 }}
                title="View accepted formats"
              >
                <Info size={13} />
                <span>Accepted Formats</span>
              </button>
            </div>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 'var(--space-sm)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="Search documents..."
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
              {sourceSearch && (
                <button onClick={() => setSourceSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Inline list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {'Global Pool (All Questions)'.toLowerCase().includes(sourceSearch.toLowerCase()) && (
                <button
                  onClick={() => setSelectedExams(['all'])}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: selectedExams.includes('all') ? 'var(--brand-primary-alpha, rgba(99,102,241,0.15))' : 'transparent', border: selectedExams.includes('all') ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                >
                  <span style={{ fontWeight: selectedExams.includes('all') ? 600 : 400 }}>Global Pool (All Questions)</span>
                  {selectedExams.includes('all') && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
                </button>
              )}
              {exams
                .filter(ex => ex.title.toLowerCase().includes(sourceSearch.toLowerCase()))
                .map(ex => {
                  const id = ex.id || ex._id;
                  const isSelected = selectedExams.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        if (selectedExams.includes('all')) {
                          setSelectedExams([id]);
                        } else {
                          setSelectedExams(prev => {
                            if (prev.includes(id)) {
                              const next = prev.filter(x => x !== id);
                              return next.length ? next : ['all'];
                            }
                            return [...prev, id];
                          });
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', background: isSelected ? 'var(--brand-primary-alpha, rgba(99,102,241,0.15))' : 'transparent', border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{ex.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{ex.questionCount ?? ''} Q</span>
                      </div>
                      {isSelected && <Check size={14} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />}
                    </button>
                  );
                })}
              {exams.filter(ex => ex.title.toLowerCase().includes(sourceSearch.toLowerCase())).length === 0 && !'Global Pool (All Questions)'.toLowerCase().includes(sourceSearch.toLowerCase()) && (
                <p style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matching documents</p>
              )}
            </div>
          </section>

          {/* Document History */}
          <section className="glass-panel" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document History</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', padding: '4px 8px' }}>
                <Search size={12} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search history..."
                  style={{ width: '120px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {exams.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No documents uploaded yet.</p>
              ) : exams.filter(ex => ex.title.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No matching history.</p>
              ) : (
                exams.filter(ex => ex.title.toLowerCase().includes(historySearch.toLowerCase())).map(ex => (
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

        {/* Accepted Formats Popup */}
        {showFormatGuide && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowFormatGuide(false); }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '560px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={18} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Accepted Formats</h2>
                </div>
                <button onClick={() => setShowFormatGuide(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                    <FileText size={14} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI-Powered (Recommended)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Just paste or upload questions in <strong>any format</strong> — numbered, bulleted, with or without answer keys. AI will detect and parse them automatically.
                  </p>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                    <Download size={14} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Manual Format (Fallback)</span>
                  </div>
                  <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>{`1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid

2. Which planet is closest to the Sun?
A) Earth
B) Venus
C) Mercury
D) Mars

---ANSWERS---
1 B
2 C`}</pre>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>JSON Format</span>
                  </div>
                  <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>{`[{
  "scenario": "What is 2+2?",
  "options": ["3", "4", "5", "6"],
  "answer": [1],
  "type": "MCQ"
}]`}</pre>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Supported file types: PDF, DOCX, TXT, JSON
              </p>
            </div>
          </div>
        )}

          {/* Paste Questions Modal */}
          {showPasteModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPasteModal(false); }}>
              <div className="glass-panel" style={{ width: '90%', maxWidth: '640px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Paste Questions</h2>
                  <button onClick={() => setShowPasteModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
                  Give your test a name, then paste your questions below.
                </p>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Test Name</label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Java Collections, OOP Concepts, Spring Boot..."
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', marginBottom: 'var(--space-sm)' }}
                />
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Example:\n\n1. What is the capital of France?\n   a) London\n   b) Paris (correct)\n   c) Berlin\n   d) Madrid\n\n2. Which is the largest planet?\n   a) Earth\n   b) Jupiter (correct)\n   c) Mars\n   d) Venus`}
                  style={{ width: '100%', minHeight: '250px', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {pasteText.trim().length > 0 ? `${pasteText.trim().split('\n').length} lines` : 'No content'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowPasteModal(false)} className="btn btn-secondary">Cancel</button>
                    <button
                      onClick={handlePasteSubmit}
                      className="btn btn-primary"
                      disabled={!pasteText.trim() || pasteProcessing}
                      style={{ minWidth: '140px' }}
                    >
                      {pasteProcessing ? <Loader2 size={16} className="auth-spinner" /> : <><ClipboardPaste size={14} style={{ marginRight: '0.4rem' }} /> Parse Questions</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Name Prompt Modal */}
          {pendingUpload && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) { setPendingUpload(null); setUploadName(''); } }}>
              <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Name Your Test</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
                  Give this uploaded test a name so you can find it easily later.
                </p>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Java Collections, OOP Concepts..."
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && uploadName.trim()) confirmUpload(); }}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-md)' }}>
                  <button onClick={() => { setPendingUpload(null); setUploadName(''); }} className="btn btn-secondary">Cancel</button>
                  <button onClick={confirmUpload} className="btn btn-primary" disabled={!uploadName.trim()}>Upload</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
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
      {/* Exit Exam Confirmation Modal */}
      <ConfirmModal
        open={showExitModal}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Exit Assessment?"
        message={
          mode === 'simulation'
            ? "You are currently in a timed proctored exam. Exiting will cancel this exam session and your unsaved answers will be discarded."
            : isOaBlitz
            ? "You are currently in an OA Blitz sprint. Exiting now will forfeit the exam and answers will not be recorded."
            : "Are you sure you want to exit this practice session? Your current progress will be lost."
        }
        confirmText="Exit Exam"
        cancelText="Resume & Stay Fullscreen"
        danger={true}
      />

      {/* Mobile PWA Top Bar */}
      <div className="test-mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            Q{currentIdx + 1}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
              /{questions.length}
            </span>
          </span>
          {isOaBlitz && (
            <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
              OA Blitz
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOaBlitz ? (
            <PerQuestionTimer
              timeLeft={questionTimeLeft}
              totalDuration={perQuestionSeconds}
              size={36}
              strokeWidth={4}
              compact={true}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: timerCritical ? '#ef4444' : 'var(--text-primary)' }}>
              <Clock size={13} /> {formatTime(timeLeft)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMobileNavigator(true)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="View Question Palette"
          >
            <ListFilter size={13} /> Qs
          </button>

          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="icon-btn"
            style={{ padding: '4px', color: 'var(--text-muted)' }}
            title="Exit Assessment"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Left Panel */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }} className="test-sidebar test-desktop-sidebar">
        {/* OA Blitz Timer vs Full Timer */}
        {isOaBlitz ? (
          <div className={`card ${questionTimeLeft <= 10 ? 'pulse-urgent-card' : ''}`} style={{ textAlign: 'center', borderColor: questionTimeLeft <= 10 ? '#ef4444' : questionTimeLeft <= 25 ? '#f59e0b' : 'var(--border-strong)' }}>
            <PerQuestionTimer
              timeLeft={questionTimeLeft}
              totalDuration={perQuestionSeconds}
              size={100}
              strokeWidth={7}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginTop: '0.6rem' }}>
              Question Timer ({perQuestionSeconds}s)
            </div>
            
            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Left:</span>
              <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(timeLeft)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                className="icon-btn"
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: soundEnabled ? '#10b981' : 'var(--text-muted)' }}
                title="Toggle countdown sound"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{soundEnabled ? 'Tick Audio On' : 'Muted'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', borderColor: timerCritical ? 'var(--text-primary)' : timerWarning ? 'var(--warning)' : 'var(--border-strong)' }}>
            <div style={{
              fontSize: '2.25rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.05em',
              animation: timerCritical ? 'pulseBorder 1s infinite' : 'none',
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{isStudy ? 'Study Session Time' : 'Time Remaining'}
            </div>
            <div style={{ marginTop: '0.75rem', height: '4px', backgroundColor: 'var(--bg-accent)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, (timeLeft / (timeMinutes * 60)) * 100))}%`,
                backgroundColor: timerCritical ? 'var(--warning)' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
        )}

        {/* Simulation Proctoring Status Card */}
        {mode === 'simulation' && (
          <div
            className="card"
            style={{
              padding: '0.85rem',
              textAlign: 'center',
              backgroundColor: proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.08)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${proctorWarnings === 0 ? 'rgba(52, 211, 153, 0.3)' : proctorWarnings === 1 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: proctorWarnings === 0 ? '#34d399' : proctorWarnings === 1 ? '#fbbf24' : '#f87171' }}>
              <ShieldAlert size={15} />
              <span>Simulation Proctor</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {proctorWarnings === 0 ? 'No infractions (0/3)' : `Warning ${proctorWarnings} of 3`}
            </div>
          </div>
        )}

        {/* OA Blitz Rules Badge */}
        {isOaBlitz && (
          <div
            className="card"
            style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
              <Lock size={13} /> Strict OA Rules
            </div>
            <div>Questions auto-lock upon advancing or timeout. Forward progression only.</div>
          </div>
        )}

        {/* Navigator */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigator</h3>
            {isOaBlitz && (
              <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Lock size={10} /> Forward-Only
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
            {questions.map((q, i) => {
              const isAnswered = (answers[q.id || q._id] || []).length > 0;
              const isCurrent = i === currentIdx;
              const isFlag = flagged.has(i);
              const isLocked = isOaBlitz && (i < currentIdx || lockedQuestions.has(i));
              const isMSQ = q.type === 'MSQ';

              return (
                <button
                  key={i}
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
                    setShowExplanation(false);
                  }}
                  title={`Q${i + 1}${isLocked ? ' [Locked]' : ''}${isMSQ ? ' [MSQ]' : ''}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isCurrent ? 'var(--text-primary)' : isFlag ? 'var(--warning)' : 'var(--border-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: isCurrent ? 'var(--text-primary)' : isAnswered ? 'var(--bg-accent)' : 'transparent',
                    color: isCurrent ? 'var(--bg-primary)' : 'var(--text-primary)',
                    opacity: isLocked && !isCurrent ? 0.75 : 1,
                    transition: 'all 0.15s',
                    cursor: isLocked && !isCurrent ? 'not-allowed' : 'pointer',
                    position: 'relative',
                  }}
                >
                  {i + 1}
                  {isFlag && <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', backgroundColor: 'var(--warning)', borderRadius: '50%' }} />}
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

        {!isOaBlitz && (
          <button className="btn btn-secondary" onClick={goToReview} style={{ color: 'var(--text-muted)' }}>
            {isStudy ? 'End Session' : 'Review & Submit'}
          </button>
        )}
      </div>

      {/* Main Question Area */}
      <div className="card test-mobile-question-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Q{currentIdx + 1} <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>/ {questions.length}</span></span>
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

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 500, marginBottom: '1.5rem' }}>{currentQ.scenario}</p>

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

          {/* Study Mode Explanations & AI Tutor */}
          {isStudy && isChecked && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Static Reference Explanation */}
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

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', marginTop: '1rem' }}>
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isStudy && !isChecked && questionAnswer.length > 0 && (
              <button onClick={handleCheck} className="btn btn-primary" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                Check Answer
              </button>
            )}
            {isOaBlitz ? (
              <button
                className="btn btn-primary"
                onClick={() => handleAdvanceOaQuestion(false)}
                style={{
                  paddingLeft: '1.65rem',
                  paddingRight: '1.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{currentIdx === questions.length - 1 ? 'Lock & Submit Exam' : 'Lock & Next'}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={currentIdx === questions.length - 1 ? goToReview : handleNext}
              >
                {currentIdx === questions.length - 1 ? (isStudy ? 'Finish' : 'Review') : 'Next'}
                {currentIdx < questions.length - 1 && <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigator Bottom Sheet Drawer */}
      {showMobileNavigator && (
        <>
          <div className="mobile-navigator-backdrop" onClick={() => setShowMobileNavigator(false)} />
          <div className="mobile-navigator-sheet">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ListFilter size={18} /> Question Palette
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {answeredCount} of {questions.length} answered
                </span>
              </div>
              <button
                onClick={() => setShowMobileNavigator(false)}
                className="icon-btn"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.55rem',
              overflowY: 'auto',
              maxHeight: '45vh',
              padding: '6px 2px 1rem 2px'
            }}>
              {questions.map((q, i) => {
                const isAnswered = (answers[q.id || q._id] || []).length > 0;
                const isCurrent = i === currentIdx;
                const isFlag = flagged.has(i);
                const isLocked = isOaBlitz && (i < currentIdx || lockedQuestions.has(i));

                return (
                  <button
                    key={i}
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
                      setShowExplanation(false);
                      setShowMobileNavigator(false);
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isCurrent ? 'var(--text-primary)' : isFlag ? 'var(--warning)' : 'var(--border-strong)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: isCurrent ? 'var(--text-primary)' : isAnswered ? 'var(--bg-accent)' : 'transparent',
                      color: isCurrent ? 'var(--bg-primary)' : 'var(--text-primary)',
                      opacity: isLocked && !isCurrent ? 0.75 : 1,
                      cursor: isLocked && !isCurrent ? 'not-allowed' : 'pointer',
                      position: 'relative'
                    }}
                  >
                    {i + 1}
                    {isFlag && <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', backgroundColor: 'var(--warning)', borderRadius: '50%' }} />}
                    {isLocked && !isCurrent && (
                      <Lock size={10} style={{ position: 'absolute', top: '3px', right: '3px', opacity: 0.7 }} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowMobileNavigator(false)}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              Close Palette
            </button>
          </div>
        </>
      )}
    </div>
  );
}
