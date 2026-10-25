'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { registerSpeechRecognition } from '@/lib/hardwareMedia';

export function stripAcousticEcho(candidateText, questionText) {
  if (!candidateText) return '';
  if (!questionText) return candidateText.trim();
  let cleaned = candidateText.trim();

  const qClean = questionText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const cClean = cleaned.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  // Only reject if candidate's entire utterance is a long exact verbatim duplicate of the question (> 35 chars)
  if (qClean.length > 35 && cClean.length > 35) {
    if (cClean === qClean || (cClean.includes(qClean) && cClean.length <= qClean.length + 10)) {
      return '';
    }
  }

  // Remove full question sentences (must be at least 30 chars long) if they were echoed by speakers into the mic
  const clauses = questionText.split(/[.?!]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 30);
  for (const clause of clauses) {
    const idx = cleaned.toLowerCase().indexOf(clause);
    if (idx !== -1 && cleaned.length > clause.length + 5) {
      cleaned = (cleaned.slice(0, idx) + ' ' + cleaned.slice(idx + clause.length)).trim();
    }
  }

  return cleaned.replace(/\s+/g, ' ').replace(/^[,.;!?-]+\s*/, '').trim();
}

export function useInterviewSpeech({
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
  isAiSpeaking: externalIsAiSpeaking,
  setIsAiSpeaking: externalSetIsAiSpeaking,
  isAiSpeakingRef: externalIsAiSpeakingRef,
  lastAiSpeechEndedAtRef: externalLastAiSpeechEndedAtRef,
  transcript: externalTranscript,
  setTranscript: externalSetTranscript,
  transcriptRef: externalTranscriptRef,
  currentInterviewerQuestionRef: externalCurrentInterviewerQuestionRef,
  lastSpokenSpeechTimestampRef: externalLastSpokenSpeechTimestampRef,
  accumulatedTranscriptRef: externalAccumulatedTranscriptRef
}) {
  const [localTranscript, setLocalTranscript] = useState('');
  const transcript = externalTranscript !== undefined ? externalTranscript : localTranscript;
  const setTranscript = externalSetTranscript || setLocalTranscript;

  const [localIsAiSpeaking, setLocalIsAiSpeaking] = useState(false);
  const isAiSpeaking = externalIsAiSpeaking !== undefined ? externalIsAiSpeaking : localIsAiSpeaking;
  const setIsAiSpeaking = externalSetIsAiSpeaking || setLocalIsAiSpeaking;

  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [speechPulse, setSpeechPulse] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.05);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');

  const localIsAiSpeakingRef = useRef(false);
  const isAiSpeakingRef = externalIsAiSpeakingRef || localIsAiSpeakingRef;

  const localLastAiSpeechEndedAtRef = useRef(0);
  const lastAiSpeechEndedAtRef = externalLastAiSpeechEndedAtRef || localLastAiSpeechEndedAtRef;

  const localLastSpokenSpeechTimestampRef = useRef(0);
  const lastSpokenSpeechTimestampRef = externalLastSpokenSpeechTimestampRef || localLastSpokenSpeechTimestampRef;

  const localAccumulatedTranscriptRef = useRef('');
  const accumulatedTranscriptRef = externalAccumulatedTranscriptRef || localAccumulatedTranscriptRef;

  const localCurrentInterviewerQuestionRef = useRef('');
  const currentInterviewerQuestionRef = externalCurrentInterviewerQuestionRef || localCurrentInterviewerQuestionRef;

  const recognitionRef = useRef(null);
  const speechRestartTimeoutRef = useRef(null);
  const speechFailureCountRef = useRef(0);
  const webSpeechDisabledRef = useRef(false);
  const lastSpokenMessageIdRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const speechSafetyTimeoutRef = useRef(null);
  const isSpeechCleanedUpRef = useRef(false);

  // Bulletproof Speech Recognition & TTS Stop (Immediate Hardware Release)
  const stopSpeechRecognition = useCallback(() => {
    isSpeechCleanedUpRef.current = true;
    webSpeechDisabledRef.current = true;
    if (speechRestartTimeoutRef.current) {
      clearTimeout(speechRestartTimeoutRef.current);
      speechRestartTimeoutRef.current = null;
    }
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        const rec = recognitionRef.current;
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.onstart = null;
        if (typeof rec.abort === 'function') {
          rec.abort();
        } else if (typeof rec.stop === 'function') {
          rec.stop();
        }
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (typeof window !== 'undefined') {
      window._activeUtterance = null;
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    setIsAiSpeaking(false);
    if (isAiSpeakingRef) isAiSpeakingRef.current = false;
    setSpeechPulse(0);
  }, [isAiSpeakingRef, setIsAiSpeaking]);

  // Load preferred voice and speed configured during setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVoice = localStorage.getItem('preferred_interview_voice');
    const savedSpeed = localStorage.getItem('preferred_interview_speed');
    if (savedVoice) setSelectedVoiceUri(savedVoice);
    if (savedSpeed) setVoiceSpeed(parseFloat(savedSpeed));

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    }
  }, []);

  // Emergency interrupt function allowing candidate to immediately answer
  const interruptAiAndAnswer = useCallback(() => {
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
    activeUtteranceRef.current = null;
    if (typeof window !== 'undefined') {
      window._activeUtterance = null;
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    lastAiSpeechEndedAtRef.current = Date.now();
    isAiSpeakingRef.current = false;
    setIsAiSpeaking(false);
    setSpeechPulse(0);
    lastVoiceTimestampRef.current = Date.now();
    setSilenceSeconds(0);
    setTranscript('');
    if (externalTranscriptRef) externalTranscriptRef.current = '';
    accumulatedTranscriptRef.current = '';
    recordedAudioChunksRef.current = [];
    untranscribedChunksRef.current = [];

    if (recognitionRef.current && !webSpeechDisabledRef.current) {
      try { recognitionRef.current.start(); } catch {}
    }
    toastRef.current?.info('Microphone ready! Speak your answer now.');
  }, [isAiSpeakingRef, setIsAiSpeaking, lastAiSpeechEndedAtRef, lastVoiceTimestampRef, setSilenceSeconds, setTranscript, externalTranscriptRef, accumulatedTranscriptRef, recordedAudioChunksRef, untranscribedChunksRef, toastRef]);

  // Text-To-Speech function for AI Interviewer with Complete Acoustic Isolation & GC Guard
  const speakText = useCallback((text) => {
    if (!text || isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);
      currentInterviewerQuestionRef.current = text.trim();

      if (speechSafetyTimeoutRef.current) {
        clearTimeout(speechSafetyTimeoutRef.current);
        speechSafetyTimeoutRef.current = null;
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      setTranscript('');
      if (externalTranscriptRef) externalTranscriptRef.current = '';
      accumulatedTranscriptRef.current = '';
      lastSpokenSpeechTimestampRef.current = 0;
      recordedAudioChunksRef.current = [];
      untranscribedChunksRef.current = [];
      setAutoSubmitCountdown(null);

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        window._activeUtterance = utterance; // Prevent Chrome GC bug dropping audio
      }

      utterance.rate = voiceSpeed;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice = voices.find((v) => v.voiceURI === selectedVoiceUri);
      if (!chosenVoice) {
        chosenVoice = voices.find((v) =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Guy')) &&
          v.lang.startsWith('en')
        ) || voices.find((v) => v.lang.startsWith('en'));
      }

      if (chosenVoice) utterance.voice = chosenVoice;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          setSpeechPulse(Math.random() * 0.4 + 0.6);
        }
      };

      utterance.onstart = () => {
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);
        setAnswerTimeLeft(QUESTION_TIME_LIMIT);
        setSilenceSeconds(0);
        setTranscript('');
        if (externalTranscriptRef) externalTranscriptRef.current = '';
        accumulatedTranscriptRef.current = '';
        lastSpokenSpeechTimestampRef.current = 0;
        recordedAudioChunksRef.current = [];
      };

      const handleSpeechEnd = () => {
        if (speechSafetyTimeoutRef.current) {
          clearTimeout(speechSafetyTimeoutRef.current);
          speechSafetyTimeoutRef.current = null;
        }
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') {
          window._activeUtterance = null;
        }
        lastAiSpeechEndedAtRef.current = Date.now();
        setSpeechPulse(0);

        setTimeout(() => {
          setTranscript('');
          if (externalTranscriptRef) externalTranscriptRef.current = '';
          accumulatedTranscriptRef.current = '';
          lastSpokenSpeechTimestampRef.current = 0;
          recordedAudioChunksRef.current = [];
          untranscribedChunksRef.current = [];
          isAiSpeakingRef.current = false;
          setIsAiSpeaking(false);
          setSpeechPulse(0);
          lastAiSpeechEndedAtRef.current = Date.now();
          lastVoiceTimestampRef.current = Date.now();
          setSilenceSeconds(0);

          if (recognitionRef.current && !webSpeechDisabledRef.current) {
            try { recognitionRef.current.start(); } catch {}
          }
        }, 400);
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error or dropped:', err);
        handleSpeechEnd();
      };

      const wordCount = (text || '').split(/\s+/).filter(Boolean).length;
      const estimatedSecs = Math.max(3.5, (wordCount / (2.2 * Math.max(0.7, voiceSpeed))) + 1.8);
      speechSafetyTimeoutRef.current = setTimeout(() => {
        if (isAiSpeakingRef.current) {
          console.warn('TTS safety duration reached, unlocking microphone.');
          handleSpeechEnd();
        }
      }, Math.round(estimatedSecs * 1000));

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      setSpeechPulse(0);
    }
  }, [isAudioMuted, isAiSpeakingRef, setIsAiSpeaking, currentInterviewerQuestionRef, setTranscript, externalTranscriptRef, accumulatedTranscriptRef, lastSpokenSpeechTimestampRef, recordedAudioChunksRef, untranscribedChunksRef, setAutoSubmitCountdown, voiceSpeed, selectedVoiceUri, setAnswerTimeLeft, QUESTION_TIME_LIMIT, setSilenceSeconds, lastAiSpeechEndedAtRef, lastVoiceTimestampRef]);

  // Press Space to interrupt AI speech and answer immediately
  useEffect(() => {
    const handleSpaceInterrupt = (e) => {
      if (e.code === 'Space' && isAiSpeaking && !sendingAnswer) {
        e.preventDefault();
        interruptAiAndAnswer();
      }
    };
    window.addEventListener('keydown', handleSpaceInterrupt);
    return () => window.removeEventListener('keydown', handleSpaceInterrupt);
  }, [isAiSpeaking, sendingAnswer, interruptAiAndAnswer]);

  // Auto-speak new interviewer messages
  useEffect(() => {
    if (!session || !session.messages || session.messages.length === 0) return;
    const lastMsg = session.messages[session.messages.length - 1];
    const msgId = lastMsg?.id || `${lastMsg?.role}_${lastMsg?.timestamp || ''}_${lastMsg?.content?.slice(0, 20)}`;
    if (lastMsg && lastMsg.role === 'interviewer' && msgId !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = msgId;
      speakText(lastMsg.content);
    }
  }, [session, speakText]);

  // Web Speech Recognition (with crash prevention, throttle backoff, and Brave/offline fallback)
  useEffect(() => {
    if (finishing || session?.status === 'COMPLETED' || isCleanedUpRef?.current || isSpeechCleanedUpRef.current) {
      stopSpeechRecognition();
      return;
    }

    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      webSpeechDisabledRef.current = true;
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      registerSpeechRecognition(recognition);

      recognition.onresult = (event) => {
        if (finishing || session?.status === 'COMPLETED' || isCleanedUpRef?.current || isSpeechCleanedUpRef.current || isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
          return;
        }

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            sessionFinal += item[0].transcript + ' ';
          } else {
            sessionInterim += item[0].transcript;
          }
        }

        if (sessionFinal) {
          accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + sessionFinal).trim();
        }

        let full = (accumulatedTranscriptRef.current + ' ' + sessionInterim).trim();

        if (full) {
          setTranscript(full);
          if (externalTranscriptRef) externalTranscriptRef.current = full;
          lastSpokenSpeechTimestampRef.current = Date.now();
        }

        const lower = full.toLowerCase();
        if (lower.includes('skip question') || lower.includes('skip this question')) {
          handleSkipRef.current?.('[Candidate requested to skip via voice]');
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.warn('SpeechRecognition not allowed or disabled by browser, falling back to Whisper.');
          webSpeechDisabledRef.current = true;
          return;
        }
        speechFailureCountRef.current += 1;
        if (speechFailureCountRef.current > 4) {
          console.warn('SpeechRecognition failing repeatedly, switching entirely to Whisper audio fallback.');
          webSpeechDisabledRef.current = true;
        }
      };

      recognition.onend = () => {
        if (webSpeechDisabledRef.current || isAiSpeakingRef.current || isCleanedUpRef?.current || isSpeechCleanedUpRef.current || finishing || session?.status === 'COMPLETED') {
          return;
        }
        if (speechRestartTimeoutRef.current) {
          clearTimeout(speechRestartTimeoutRef.current);
        }
        // Throttled restart with at least 800ms cooldown to completely eliminate main-thread freeze
        speechRestartTimeoutRef.current = setTimeout(() => {
          if (!webSpeechDisabledRef.current && !isAiSpeakingRef.current && !isCleanedUpRef?.current && !isSpeechCleanedUpRef.current && !finishing && session?.status !== 'COMPLETED' && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              speechFailureCountRef.current += 1;
              if (speechFailureCountRef.current > 4) {
                webSpeechDisabledRef.current = true;
              }
            }
          }
        }, 800);
      };

      recognitionRef.current = recognition;

      if (!isAiSpeaking && !isAiSpeakingRef.current && !webSpeechDisabledRef.current && !finishing && session?.status !== 'COMPLETED') {
        try { recognition.start(); } catch {}
      }
    } catch (e) {
      console.warn('Speech recognition init bypassed:', e);
      webSpeechDisabledRef.current = true;
    }

    return () => {
      stopSpeechRecognition();
    };
  }, [finishing, session?.status, handleSkipRef, isAiSpeaking, isCleanedUpRef, accumulatedTranscriptRef, externalTranscriptRef, isAiSpeakingRef, lastAiSpeechEndedAtRef, lastSpokenSpeechTimestampRef, setTranscript, stopSpeechRecognition]);

  // Immediately terminate speech & mic when session completes or concludes
  useEffect(() => {
    if (finishing || session?.status === 'COMPLETED') {
      stopSpeechRecognition();
    }
  }, [finishing, session?.status, stopSpeechRecognition]);

  // Hardware watchdog listener
  useEffect(() => {
    const onHardwareStopped = () => {
      stopSpeechRecognition();
    };
    window.addEventListener('hardware-media-stopped', onHardwareStopped);
    return () => window.removeEventListener('hardware-media-stopped', onHardwareStopped);
  }, [stopSpeechRecognition]);

  // Live continuous speech transcription via Groq Whisper fallback (runs for both video & voice-only modes)
  useEffect(() => {
    if (isAiSpeaking || isAiSpeakingRef.current || finishing || isCleanedUpRef?.current || isSpeechCleanedUpRef.current || session?.status === 'COMPLETED') return;

    const transcribeInterval = setInterval(async () => {
      if (finishing || isCleanedUpRef?.current || isSpeechCleanedUpRef.current || session?.status === 'COMPLETED') {
        untranscribedChunksRef.current = [];
        return;
      }
      if (isTranscribingAudio || isAiSpeaking || isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
        untranscribedChunksRef.current = [];
        return;
      }
      const now = Date.now();
      const timeSinceVoice = now - lastVoiceTimestampRef.current;
      const chunks = untranscribedChunksRef.current;

      if (hasNewAudioDataRef.current && chunks.length >= 2 && (timeSinceVoice > 1200 || chunks.length >= 4)) {
        hasNewAudioDataRef.current = false;
        const chunksToProcess = [...chunks];
        untranscribedChunksRef.current = [];

        const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const audioBlob = new Blob(chunksToProcess, { type: mimeType });
        if (audioBlob.size > 400) {
          try {
            setIsTranscribingAudio(true);
            const formData = new FormData();
            formData.append('audio', audioBlob, 'chunk.webm');
            const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.text) {
              let newText = data.text.trim();
              if (currentInterviewerQuestionRef.current) {
                newText = stripAcousticEcho(newText, currentInterviewerQuestionRef.current);
              }
              if (newText && !newText.toLowerCase().includes('thank you') && newText.length > 2) {
                setTranscript((prev) => {
                  const cleanPrev = prev.trim();
                  const updated = !cleanPrev
                    ? newText
                    : cleanPrev.toLowerCase().includes(newText.toLowerCase())
                    ? cleanPrev
                    : `${cleanPrev} ${newText}`;
                  if (externalTranscriptRef) externalTranscriptRef.current = updated;
                  return updated;
                });
                lastSpokenSpeechTimestampRef.current = Date.now();
              }
            }
          } catch (err) {
            console.warn('Whisper chunk transcription error:', err);
          } finally {
            setIsTranscribingAudio(false);
          }
        }
      }
    }, 1400);

    return () => clearInterval(transcribeInterval);
  }, [finishing, session?.status, isCleanedUpRef, hasNewAudioDataRef, isAiSpeaking, isTranscribingAudio, lastVoiceTimestampRef, untranscribedChunksRef, currentInterviewerQuestionRef, externalTranscriptRef, isAiSpeakingRef, lastAiSpeechEndedAtRef, lastSpokenSpeechTimestampRef, setTranscript]);

  // Reset silence counter when candidate speaks (throttled to avoid redundant state re-renders)
  const lastSilenceResetTimeRef = useRef(0);
  useEffect(() => {
    if (audioLevel > 15 || (transcript && transcript.length > 0)) {
      const now = Date.now();
      if (now - lastSilenceResetTimeRef.current > 1000) {
        lastSilenceResetTimeRef.current = now;
        setSilenceSeconds(0);
      }
    }
  }, [audioLevel, setSilenceSeconds, transcript]);

  return {
    transcript,
    setTranscript,
    isTranscribingAudio,
    isAiSpeaking,
    setIsAiSpeaking,
    speechPulse,
    isAudioMuted,
    setIsAudioMuted,
    speakText,
    interruptAiAndAnswer,
    stopSpeechRecognition,
    isAiSpeakingRef,
    lastAiSpeechEndedAtRef,
    lastSpokenSpeechTimestampRef,
    accumulatedTranscriptRef,
    currentInterviewerQuestionRef,
    recognitionRef,
    speechSafetyTimeoutRef,
    activeUtteranceRef
  };
}
