'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { playTickSound, playTimeoutChime } from '../components/testAudioCues';
import { useTestProctoring } from './useTestProctoring';

export function useTestSession({
  router,
  toast,
  mode,
  perQuestionSeconds,
  soundEnabled,
  timeMinutes,
  selectedExams,
  questionCount,
  phase,
  setPhase
}) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [checked, setChecked] = useState(new Set());
  const [checkedResults, setCheckedResults] = useState({});
  const [aiExplanations, setAiExplanations] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef(null);

  // Preloader & Scheduling State
  const [showPreloader, setShowPreloader] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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

  const handleSubmit = useCallback(async (customOverrides = {}) => {
    if (submittingRef.current || submitting) return;
    submittingRef.current = true;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const timeTaken = testStartTime ? Math.max(1, (performance.now() - testStartTime) / 1000) : 1;
    localStorage.removeItem(`test_answers_${selectedExams.join(',')}`);

    const finalTimeMap = customOverrides.questionTimeTaken || questionTimeMap;
    const finalTimedOut = customOverrides.timedOutQuestions
      ? Array.from(customOverrides.timedOutQuestions)
      : Array.from(timedOutQuestions);

    // Map user display selections back to original database option indices for backend grading
    const dbUserAnswers = {};
    for (const q of questions) {
      const qId = q.id || q._id;
      const userSelected = answers[qId] || [];
      if (q._displayToOriginal && Array.isArray(q._displayToOriginal)) {
        dbUserAnswers[qId] = userSelected
          .map(dIdx => q._displayToOriginal[dIdx])
          .filter(idx => typeof idx === 'number');
      } else {
        dbUserAnswers[qId] = userSelected;
      }
    }

    try {
      const res = await apiFetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExams.includes('all') ? 'all' : selectedExams.join(','),
          questionIds: questions.map(q => q.id || q._id),
          timeTaken,
          userAnswers: dbUserAnswers,
          testMode: mode,
          perQuestionTimeLimitSeconds: isOaBlitz ? perQuestionSeconds : null,
          questionTimeTaken: isOaBlitz ? finalTimeMap : null,
          timedOutQuestionIds: isOaBlitz ? finalTimedOut : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        const resultId = data.data?.id || data.data?._id || data?.id || data?._id;
        if (resultId) {
          setPhase('submitted');
          router.push(`/results/${resultId}`);
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname.includes('/test')) {
              window.location.href = `/results/${resultId}`;
            }
          }, 1200);
        } else {
          router.push('/test?tab=results');
        }
      } else {
        toast.error(data.message || data.error || 'Failed to save result');
        submittingRef.current = false;
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [submitting, testStartTime, selectedExams, questions, answers, mode, isOaBlitz, perQuestionSeconds, questionTimeMap, timedOutQuestions, router, toast, setPhase]);

  const onExitSession = useCallback(() => {
    clearInterval(timerRef.current);
    submittingRef.current = false;
    setSubmitting(false);
    setPhase('config');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setQuestionTimeMap({});
    setTimedOutQuestions(new Set());
    setLockedQuestions(new Set());
    setShowMobileNavigator(false);
  }, [setPhase]);

  const {
    showExitModal,
    setShowExitModal,
    isFullscreen,
    proctorWarnings,
    exitFullscreen,
    handleCancelExit,
    handleConfirmExit,
    resetProctorWarnings
  } = useTestProctoring({
    mode,
    phase,
    submitting,
    handleSubmit,
    toast,
    onExitSession
  });

  const goToReview = useCallback(() => {
    setPhase('review');
  }, [setPhase]);

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
  }, [currentQ, currentIdx, questions.length, perQuestionSeconds, questionTimeLeft, soundEnabled, timedOutQuestions, questionTimeMap, submitting, handleSubmit, toast]);

  // Overall Exam Timer (countdown for timed modes only, completely disabled in SRS study mode)
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

  const toggleOption = useCallback((optIdx) => {
    if (!currentQ) return;
    const qId = currentQ.id || currentQ._id;
    if (!qId) return;

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

    const userSelected = answers[qId] || [];

    // Instant local evaluation if correct answer is present on question
    if (currentQ.answer && Array.isArray(currentQ.answer)) {
      const isCorrect = userSelected.length === currentQ.answer.length &&
        userSelected.every(a => currentQ.answer.includes(a));
      setCheckedResults(prev => ({
        ...prev,
        [qId]: {
          isCorrect,
          correctAnswer: currentQ.answer,
          explanation: currentQ.explanation || 'Reference answer.'
        }
      }));
      setChecked(prev => new Set([...prev, qId]));
      setShowExplanation(true);

      // Asynchronously record spaced repetition review if persistent question
      if (!qId.startsWith('temp_') && !qId.startsWith('q_')) {
        const originalUserAnswer = currentQ._displayToOriginal
          ? userSelected.map(d => currentQ._displayToOriginal[d])
          : userSelected;
        apiFetch('/api/reviews/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: qId, userAnswer: originalUserAnswer })
        }).catch(() => {});
      }
      return;
    }

    try {
      const originalUserAnswer = currentQ._displayToOriginal
        ? userSelected.map(d => currentQ._displayToOriginal[d])
        : userSelected;

      const res = await apiFetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, userAnswer: originalUserAnswer })
      });
      const data = await res.json();
      if (data.success) {
        let displayCorrect = data.data?.correctAnswer || [];
        if (currentQ._displayToOriginal && Array.isArray(displayCorrect)) {
          displayCorrect = displayCorrect
            .map(origIdx => currentQ._displayToOriginal.indexOf(origIdx))
            .filter(idx => idx !== -1);
        }
        setCheckedResults(prev => ({
          ...prev,
          [qId]: { ...data.data, correctAnswer: displayCorrect }
        }));
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
  }, [phase, isOaBlitz, currentQ, currentIdx, handleNext, handlePrev, handleAdvanceOaQuestion, toggleFlag, toggleOption, toast]);

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
    resetProctorWarnings();
    setQuestionTimeMap({});
    setTimedOutQuestions(new Set());
    setLockedQuestions(new Set());
    setQuestionTimeLeft(perQuestionSeconds);
    setShowMobileNavigator(false);

    const savedAnswers = localStorage.getItem(`test_answers_${selectedExams.join(',')}`);
    if (savedAnswers && !isStudy && !isOaBlitz) {
      try { setAnswers(JSON.parse(savedAnswers)); } catch (e) {}
    }

    const calculatedTotalSeconds = isStudy
      ? 0
      : isOaBlitz
      ? pendingQuestions.length * perQuestionSeconds
      : timeMinutes * 60;

    setTimeLeft(calculatedTotalSeconds);
    setTestStartTime(performance.now());
    submittingRef.current = false;
    setSubmitting(false);
    setPhase('testing');
  }, [pendingQuestions, selectedExams, isStudy, isOaBlitz, perQuestionSeconds, timeMinutes, setPhase, resetProctorWarnings]);

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

      const shuffled = questionList.map((q, i) => {
        const uniqueId = q.id || q._id || `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 7)}`;
        const originalOptions = Array.isArray(q.options) ? q.options : [];
        const originalAnswer = Array.isArray(q.answer)
          ? q.answer
          : typeof q.answer === 'number'
          ? [q.answer]
          : [];

        // Randomly shuffle options for each question so correct answers are evenly distributed across A, B, C, D
        let shuffledOptions = originalOptions;
        let displayAnswer = originalAnswer;
        let displayToOriginal = originalOptions.map((_, idx) => idx);

        if (originalOptions.length >= 2) {
          const indices = originalOptions.map((_, idx) => idx);
          // Fisher-Yates shuffle
          for (let j = indices.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [indices[j], indices[k]] = [indices[k], indices[j]];
          }
          shuffledOptions = indices.map(idx => originalOptions[idx]);
          displayToOriginal = indices;
          // Remap correct answer to the new shuffled positions
          displayAnswer = originalAnswer
            .map(origIdx => indices.indexOf(origIdx))
            .filter(newIdx => newIdx !== -1)
            .sort((a, b) => a - b);
        }

        return {
          ...q,
          id: uniqueId,
          _id: uniqueId,
          options: shuffledOptions,
          answer: displayAnswer,
          _displayToOriginal: displayToOriginal
        };
      }).sort(() => Math.random() - 0.5).slice(0, questionCount);

      setPendingQuestions(shuffled);
      setShowPreloader(true);
    } catch (err) {
      toast.error('Failed to load questions');
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => {
    const qId = q.id || q._id;
    return qId && (answers[qId] || []).length > 0;
  }).length;
  const unansweredCount = questions.length - answeredCount;
  const timerWarning = !isStudy && timeLeft < 300 && timeLeft > 0;
  const timerCritical = !isStudy && timeLeft < 60 && timeLeft > 0;

  return {
    questions,
    currentIdx,
    setCurrentIdx,
    answers,
    flagged,
    checked,
    checkedResults,
    aiExplanations,
    aiLoading,
    timeLeft,
    submitting,
    showExplanation,
    setShowExplanation,
    questionTimeLeft,
    lockedQuestions,
    showMobileNavigator,
    setShowMobileNavigator,
    showExitModal,
    setShowExitModal,
    isFullscreen,
    proctorWarnings,
    showPreloader,
    showScheduleModal,
    setShowScheduleModal,
    isStudy,
    isOaBlitz,
    currentQ,
    toggleOption,
    handleCheck,
    handleAiExplain,
    toggleFlag,
    handleNext,
    handlePrev,
    goToReview,
    handleSubmit,
    handleAdvanceOaQuestion,
    handleCancelExit,
    handleConfirmExit,
    finishStartTest,
    startTest,
    formatTime,
    answeredCount,
    unansweredCount,
    timerWarning,
    timerCritical
  };
}
