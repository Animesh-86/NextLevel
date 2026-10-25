'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import SpiralLoader from '@/components/SpiralLoader';
import { useInterviewHardware } from './hooks/useInterviewHardware';
import { useInterviewSpeech, stripAcousticEcho } from './hooks/useInterviewSpeech';
import { useInterviewProctoring } from './hooks/useInterviewProctoring';
import { useInterviewSession } from './hooks/useInterviewSession';
import { stopAllHardwareMedia } from '@/lib/hardwareMedia';
import InterviewHUDBar from './components/InterviewHUDBar';
import InterviewAiStage from './components/InterviewAiStage';
import InterviewCandidateStage from './components/InterviewCandidateStage';
import InterviewDialogueHistory from './components/InterviewDialogueHistory';

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const interviewId = params?.id;

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => (typeof document !== 'undefined' ? !!document.fullscreenElement : false));

  const QUESTION_TIME_LIMIT = 90;
  const [answerTimeLeft, setAnswerTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [, setSilenceSeconds] = useState(0);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
  const isCleanedUpRef = useRef(false);
  const stopSpeechRecognitionRef = useRef(null);

  // 1. Hardware Hook
  const isAiSpeakingRef = useRef(false);
  const lastAiSpeechEndedAtRef = useRef(0);

  const {
    videoRef,
    setVideoRef,
    mediaStreamRef,
    cameraActive,
    audioLevel,
    recordedAudioChunksRef,
    untranscribedChunksRef,
    lastVoiceTimestampRef,
    hasNewAudioDataRef,
    startCameraAndMic,
    releaseAllMedia,
    transcribeAudioViaWhisper
  } = useInterviewHardware({
    toastRef,
    isAiSpeakingRef,
    lastAiSpeechEndedAtRef
  });

  // State & Refs shared across hooks
  const handleSkipRef = useRef(null);
  const speakTextRef = useRef(null);
  const proctorWarningsRef = useRef(0);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const currentInterviewerQuestionRef = useRef('');
  const lastSpokenSpeechTimestampRef = useRef(0);
  const accumulatedTranscriptRef = useRef('');

  // 2. Session & Actions Lifecycle Hook
  const {
    session,
    setSession,
    loading,
    sendingAnswer,
    finishing,
    timeLeft,
    handleSubmitAnswerRef,
    handleFinishInterview,
    handleSubmitAnswer,
    handleSkipQuestion,
    handleRequestHint
  } = useInterviewSession({
    interviewId,
    router,
    toast,
    releaseAllMedia,
    stopSpeechRecognition: () => stopSpeechRecognitionRef.current?.(),
    transcript,
    transcriptRef,
    setTranscript,
    recordedAudioChunksRef,
    untranscribedChunksRef,
    transcribeAudioViaWhisper,
    currentInterviewerQuestionRef,
    lastSpokenSpeechTimestampRef,
    accumulatedTranscriptRef,
    proctorWarningsRef,
    QUESTION_TIME_LIMIT,
    setAnswerTimeLeft,
    setSilenceSeconds,
    setAutoSubmitCountdown,
    speakText: (text) => speakTextRef.current?.(text),
    isAiSpeaking,
    isAiSpeakingRef
  });

  // 3. Speech Hook (receives the active session, finishing, and sendingAnswer)
  const {
    isTranscribingAudio,
    speechPulse,
    isAudioMuted,
    setIsAudioMuted,
    speakText,
    interruptAiAndAnswer,
    stopSpeechRecognition
  } = useInterviewSpeech({
    session,
    finishing,
    cameraActive,
    audioLevel,
    QUESTION_TIME_LIMIT,
    setAnswerTimeLeft,
    setSilenceSeconds,
    setAutoSubmitCountdown,
    recordedAudioChunksRef,
    untranscribedChunksRef,
    lastVoiceTimestampRef,
    hasNewAudioDataRef,
    isCleanedUpRef,
    handleSkipRef,
    sendingAnswer,
    toastRef,
    isAiSpeaking,
    setIsAiSpeaking,
    isAiSpeakingRef,
    lastAiSpeechEndedAtRef,
    transcript,
    setTranscript,
    transcriptRef,
    currentInterviewerQuestionRef,
    lastSpokenSpeechTimestampRef,
    accumulatedTranscriptRef
  });

  useEffect(() => {
    stopSpeechRecognitionRef.current = stopSpeechRecognition;
  }, [stopSpeechRecognition]);

  useEffect(() => {
    speakTextRef.current = speakText;
  }, [speakText]);

  // 4. Proctoring Hook (receives the active session, finishing, and disqualify handler)
  const {
    canvasRef,
    candidateInFrame,
    proctorWarnings,
    requestFullScreenMode
  } = useInterviewProctoring({
    session,
    finishing,
    cameraActive,
    videoRef,
    mediaStreamRef,
    toast,
    onDisqualify: handleFinishInterview,
    setShowExitConfirmModal,
    setIsFullscreen
  });

  useEffect(() => {
    proctorWarningsRef.current = proctorWarnings;
  }, [proctorWarnings]);

  useEffect(() => {
    handleSkipRef.current = handleSkipQuestion;
  }, [handleSkipQuestion]);

  // Unlock audio & speech synthesis on first candidate gesture if browser paused autoplay
  useEffect(() => {
    const unlockAudio = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Initialize camera and mic once mounted and tear down all hardware on unmount
  useEffect(() => {
    startCameraAndMic();
    return () => {
      isCleanedUpRef.current = true;
      try { stopSpeechRecognitionRef.current?.(); } catch {}
      try { releaseAllMedia(); } catch {}
      stopAllHardwareMedia();
    };
  }, [startCameraAndMic, releaseAllMedia]);

  // If session transitions to COMPLETED, immediately shut down camera and microphone
  useEffect(() => {
    if (session?.status === 'COMPLETED') {
      isCleanedUpRef.current = true;
      try { stopSpeechRecognitionRef.current?.(); } catch {}
      try { releaseAllMedia(); } catch {}
      stopAllHardwareMedia();
    }
  }, [session?.status, releaseAllMedia]);

  // Turn-Taking & Auto-Submission on Voice Pause
  useEffect(() => {
    const vadInterval = setInterval(() => {
      if (isAiSpeaking || sendingAnswer || loading || !session || session.status === 'COMPLETED') {
        setAutoSubmitCountdown(null);
        return;
      }

      const currentText = (transcriptRef.current || transcript || '').trim();
      const realText = stripAcousticEcho(currentText, currentInterviewerQuestionRef.current);
      const wordCount = realText.split(/\s+/).filter(Boolean).length;

      if (realText.length >= 15 && wordCount >= 3 && lastSpokenSpeechTimestampRef.current > 0) {
        const timeSinceWords = Date.now() - lastSpokenSpeechTimestampRef.current;
        if (timeSinceWords >= 1800) {
          setAutoSubmitCountdown(null);
          handleSubmitAnswerRef.current?.(realText);
        } else if (timeSinceWords >= 900) {
          setAutoSubmitCountdown(1);
        } else {
          setAutoSubmitCountdown(null);
        }
      } else {
        setAutoSubmitCountdown(null);
      }
    }, 200);

    return () => clearInterval(vadInterval);
  }, [isAiSpeaking, sendingAnswer, loading, session, transcriptRef, transcript, currentInterviewerQuestionRef, lastSpokenSpeechTimestampRef, handleSubmitAnswerRef]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = session?.messages?.slice().reverse().find((m) => m.role === 'interviewer')?.content || 'Calibrating interview question...';
  const totalQuestionsAsked = session?.messages?.filter((m) => m.role === 'interviewer').length || 1;
  const isTimeCritical = timeLeft < 180 && timeLeft > 0;

  if (loading) {
    return (
      <SpiralLoader
        message="Entering AI Interview Room..."
        subtext={`Calibrating technical questions for ${session?.role || 'your role'}`}
      />
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', animation: 'fadeIn 0.25s ease-out', padding: '0 0.5rem 2.5rem' }}>
      <canvas ref={canvasRef} width="80" height="60" style={{ display: 'none' }} />

      <ConfirmModal
        open={showFinishModal}
        onCancel={() => setShowFinishModal(false)}
        onConfirm={() => {
          setShowFinishModal(false);
          handleFinishInterview('Candidate concluded session');
        }}
        title="Conclude Interview Round?"
        message="Are you ready to end the interview? The AI Hiring Committee will immediately evaluate your answers, score your competencies, and generate your scorecard."
        confirmText="Conclude & View Scorecard"
        danger={false}
      />

      <ConfirmModal
        open={showExitConfirmModal}
        onCancel={() => {
          setShowExitConfirmModal(false);
          requestFullScreenMode();
        }}
        onConfirm={() => {
          setShowExitConfirmModal(false);
          handleFinishInterview('Candidate exited proctored fullscreen');
        }}
        title="Exit Proctored Interview?"
        message="You exited full-screen proctoring mode. Would you like to conclude your interview and generate your AI scorecard now, or return to full-screen mode to continue?"
        confirmText="Conclude & Submit Test"
        cancelText="Return to Fullscreen"
        danger={true}
      />

      {/* Fullscreen Security Blackout Guard for Esc Loophole */}
      {(!isFullscreen || showExitConfirmModal) && session?.status !== 'COMPLETED' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9990,
            backgroundColor: 'rgba(5, 5, 8, 0.96)',
            backdropFilter: 'blur(35px)',
            WebkitBackdropFilter: 'blur(35px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '460px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Proctor Security Active</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Interview questions, code editor, and speech prompts are obscured while outside full-screen mode to ensure academic integrity.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  handleFinishInterview('Candidate exited proctored fullscreen');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Conclude Round
              </button>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  requestFullScreenMode();
                }}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Bar */}
      <InterviewHUDBar
        session={session}
        onRequestExit={() => setShowFinishModal(true)}
        requestFullScreenMode={requestFullScreenMode}
        isFullscreen={isFullscreen}
        proctorWarnings={proctorWarnings}
        isAudioMuted={isAudioMuted}
        onToggleAudioMuted={() => {
          const next = !isAudioMuted;
          setIsAudioMuted(next);
          if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        }}
        isTimeCritical={isTimeCritical}
        formatTime={formatTime}
        timeLeft={timeLeft}
        onConclude={() => setShowFinishModal(true)}
      />

      {/* Main Two-Screen Stage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        <InterviewAiStage
          totalQuestionsAsked={totalQuestionsAsked}
          isAiSpeaking={isAiSpeaking}
          sendingAnswer={sendingAnswer}
          audioLevel={audioLevel}
          transcript={transcript}
          speechPulse={speechPulse}
          currentQuestion={currentQuestion}
          speakText={speakText}
        />

        <InterviewCandidateStage
          cameraActive={cameraActive}
          candidateInFrame={candidateInFrame}
          isAiSpeaking={isAiSpeaking}
          setVideoRef={setVideoRef}
          startCameraAndMic={startCameraAndMic}
          answerTimeLeft={answerTimeLeft}
          QUESTION_TIME_LIMIT={QUESTION_TIME_LIMIT}
          audioLevel={audioLevel}
          transcript={transcript}
          setTranscript={setTranscript}
          recordedAudioChunksRef={recordedAudioChunksRef}
          sendingAnswer={sendingAnswer}
          isTranscribingAudio={isTranscribingAudio}
          autoSubmitCountdown={autoSubmitCountdown}
          handleSkipQuestion={handleSkipQuestion}
          handleRequestHint={handleRequestHint}
          interruptAiAndAnswer={interruptAiAndAnswer}
          handleSubmitAnswer={handleSubmitAnswer}
        />
      </div>

      {/* Dialogue History */}
      <InterviewDialogueHistory messages={session?.messages || []} />
    </div>
  );
}
