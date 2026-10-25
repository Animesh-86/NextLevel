'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { stopAllHardwareMedia } from '@/lib/hardwareMedia';
import { stripAcousticEcho } from './useInterviewSpeech';

export function useInterviewSession({
  interviewId,
  router,
  toast,
  releaseAllMedia,
  stopSpeechRecognition,
  transcript,
  transcriptRef,
  setTranscript,
  recordedAudioChunksRef,
  untranscribedChunksRef,
  transcribeAudioViaWhisper,
  currentInterviewerQuestionRef,
  lastSpokenSpeechTimestampRef,
  accumulatedTranscriptRef,
  proctorWarnings,
  proctorWarningsRef,
  QUESTION_TIME_LIMIT,
  setAnswerTimeLeft,
  setSilenceSeconds,
  setAutoSubmitCountdown,
  speakText,
  isAiSpeaking,
  isAiSpeakingRef
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef(null);
  const answerTimerRef = useRef(null);
  const handleSkipRef = useRef(null);
  const handleSubmitAnswerRef = useRef(null);
  const handleQuestionTimeoutRef = useRef(null);

  // Finish interview and navigate to scorecard
  const handleFinishInterview = useCallback(async (reason = '') => {
    if (finishing) return;
    setFinishing(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    // Immediately release all microphone, camera, and speech recognition hardware
    try { stopSpeechRecognition?.(); } catch {}
    try { releaseAllMedia?.(); } catch {}
    stopAllHardwareMedia();

    const toastId = toast.loading(reason ? `${reason}. Finalizing scorecard with AI...` : 'Generating hiring scorecard with AI...');

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/finish`, {
        method: 'POST'
      });

      const data = await res.json();
      if (data.success && data.data) {
        toast.success('Interview complete! Viewing scorecard report...', { id: toastId });
        router.push(`/interview/${interviewId}/scorecard`);
      } else {
        throw new Error(data.error || 'Failed to generate scorecard');
      }
    } catch (err) {
      console.error('Finish interview error:', err);
      toast.error('Failed to finish interview: ' + err.message, { id: toastId });
      setFinishing(false);
    }
  }, [finishing, stopSpeechRecognition, releaseAllMedia, interviewId, router, toast]);

  // Submit Answer
  const handleSubmitAnswer = useCallback(async (manualText = null) => {
    if (sendingAnswer) return;

    let answerText = (manualText !== null && typeof manualText === 'string')
      ? manualText.trim()
      : (transcriptRef?.current?.trim() || transcript?.trim() || '');

    if (!answerText && recordedAudioChunksRef.current.length > 0) {
      const whisperText = await transcribeAudioViaWhisper();
      if (whisperText) {
        answerText = whisperText;
        setTranscript(whisperText);
        if (transcriptRef) transcriptRef.current = whisperText;
      }
    }

    if (currentInterviewerQuestionRef.current) {
      answerText = stripAcousticEcho(answerText, currentInterviewerQuestionRef.current);
    }

    if (!answerText || answerText.length < 5 || answerText.split(/\s+/).filter(Boolean).length < 2) {
      toast.warning('No speech detected yet. Speak your answer into your microphone.');
      return;
    }

    setSendingAnswer(true);
    setAutoSubmitCountdown(null);

    const activeWarnings = (proctorWarningsRef && typeof proctorWarningsRef.current === 'number')
      ? proctorWarningsRef.current
      : (proctorWarnings || 0);

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: answerText,
          elapsedSeconds,
          isSkip: false,
          proctoringWarnings: activeWarnings
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        setTranscript('');
        if (transcriptRef) transcriptRef.current = '';
        accumulatedTranscriptRef.current = '';
        lastSpokenSpeechTimestampRef.current = 0;
        recordedAudioChunksRef.current = [];
        untranscribedChunksRef.current = [];
        setAnswerTimeLeft(QUESTION_TIME_LIMIT);
        setSilenceSeconds(0);
        setAutoSubmitCountdown(null);
      } else {
        toast.error(data.error || 'Failed to send answer');
      }
    } catch (err) {
      console.error('Send answer error:', err);
      toast.error('Failed to submit answer');
    } finally {
      setSendingAnswer(false);
    }
  }, [
    sendingAnswer,
    transcriptRef,
    transcript,
    recordedAudioChunksRef,
    transcribeAudioViaWhisper,
    currentInterviewerQuestionRef,
    proctorWarningsRef,
    proctorWarnings,
    interviewId,
    elapsedSeconds,
    setTranscript,
    accumulatedTranscriptRef,
    lastSpokenSpeechTimestampRef,
    untranscribedChunksRef,
    setAnswerTimeLeft,
    QUESTION_TIME_LIMIT,
    setSilenceSeconds,
    setAutoSubmitCountdown,
    toast
  ]);

  handleSubmitAnswerRef.current = handleSubmitAnswer;

  // Skip Question
  const handleSkipQuestion = useCallback(async (reasonMessage = '[Candidate skipped question]') => {
    if (sendingAnswer) return;

    setTranscript('');
    if (transcriptRef) transcriptRef.current = '';
    accumulatedTranscriptRef.current = '';
    lastSpokenSpeechTimestampRef.current = 0;
    recordedAudioChunksRef.current = [];
    untranscribedChunksRef.current = [];
    setSendingAnswer(true);
    setAutoSubmitCountdown(null);

    const activeWarnings = (proctorWarningsRef && typeof proctorWarningsRef.current === 'number')
      ? proctorWarningsRef.current
      : (proctorWarnings || 0);

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reasonMessage,
          elapsedSeconds,
          isSkip: true,
          proctoringWarnings: activeWarnings
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        setAnswerTimeLeft(QUESTION_TIME_LIMIT);
        setSilenceSeconds(0);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.warn('Skip question error:', err);
    } finally {
      setSendingAnswer(false);
    }
  }, [
    sendingAnswer,
    setTranscript,
    transcriptRef,
    accumulatedTranscriptRef,
    lastSpokenSpeechTimestampRef,
    recordedAudioChunksRef,
    untranscribedChunksRef,
    setAutoSubmitCountdown,
    proctorWarningsRef,
    proctorWarnings,
    interviewId,
    elapsedSeconds,
    setAnswerTimeLeft,
    QUESTION_TIME_LIMIT,
    setSilenceSeconds
  ]);

  handleSkipRef.current = handleSkipQuestion;

  // Question Timeout Handler
  const handleQuestionTimeout = useCallback(() => {
    const aiSpeaking = isAiSpeakingRef?.current ?? isAiSpeaking;
    if (sendingAnswer || aiSpeaking) return;

    const currentText = (transcriptRef?.current?.trim() || transcript?.trim() || '');
    if (currentText.length >= 15 && currentText.split(/\s+/).filter(Boolean).length >= 3) {
      toast.info('Answer time window reached. Submitting your spoken response...', { icon: '⏱️' });
      handleSubmitAnswer(currentText);
      return;
    }

    if (speakText) {
      speakText("Time is up for this question. Let's move on to the next question.");
    }
    handleSkipQuestion('[Time limit expired for this question - advancing to next topic]');
  }, [sendingAnswer, isAiSpeakingRef, isAiSpeaking, transcriptRef, transcript, toast, handleSubmitAnswer, speakText, handleSkipQuestion]);

  handleQuestionTimeoutRef.current = handleQuestionTimeout;

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await apiFetch(`/api/interviews/${interviewId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const sess = data.data;
          setSession(sess);

          if (sess.status === 'COMPLETED') {
            try { stopSpeechRecognition?.(); } catch {}
            try { releaseAllMedia?.(); } catch {}
            stopAllHardwareMedia();
            router.replace(`/interview/${interviewId}/scorecard`);
            return;
          }

          const totalSecs = (sess.durationMinutes || 30) * 60;
          setTimeLeft(totalSecs);
        } else {
          toast.error(data.error || 'Failed to load interview session');
          router.push('/interview');
        }
      } catch (err) {
        console.error('Fetch interview error:', err);
        toast.error('Failed to load interview');
        router.push('/interview');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      fetchSession();
    }
  }, [interviewId, router, toast, releaseAllMedia, stopSpeechRecognition]);

  // Overall Countdown Timer
  useEffect(() => {
    if (loading || !session || session.status === 'COMPLETED' || finishing) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishInterview('Session time limit expired');
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, session, finishing, handleFinishInterview]);

  // Per-Question Response Timer
  useEffect(() => {
    if (loading || !session || session.status === 'COMPLETED' || finishing || isAiSpeaking) {
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
      return;
    }

    let timeoutFired = false;
    answerTimerRef.current = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          if (!timeoutFired) {
            timeoutFired = true;
            clearInterval(answerTimerRef.current);
            handleQuestionTimeoutRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
      setSilenceSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    };
  }, [loading, session, finishing, isAiSpeaking, setAnswerTimeLeft, setSilenceSeconds]);

  // Request Hint
  const handleRequestHint = async () => {
    if (sendingAnswer) return;
    setSendingAnswer(true);
    const toastId = toast.loading('Asking interviewer for clarification...');

    const activeWarnings = (proctorWarningsRef && typeof proctorWarningsRef.current === 'number')
      ? proctorWarningsRef.current
      : (proctorWarnings || 0);

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Could you clarify the technical requirements or provide a guiding hint on what architectural trade-offs you want me to evaluate?",
          elapsedSeconds,
          isSkip: false,
          proctoringWarnings: activeWarnings
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        toast.success('Interviewer provided guidance', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast.error('Failed to get clarification', { id: toastId });
    } finally {
      setSendingAnswer(false);
    }
  };

  return {
    session,
    setSession,
    loading,
    sendingAnswer,
    finishing,
    timeLeft,
    elapsedSeconds,
    handleSkipRef,
    handleSubmitAnswerRef,
    handleFinishInterview,
    handleSubmitAnswer,
    handleSkipQuestion,
    handleRequestHint
  };
}
