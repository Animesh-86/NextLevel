'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import SpiralLoader from '@/components/SpiralLoader';
import {
  Mic, MicOff, Volume2, VolumeX, Clock, Send, Play,
  Square, RefreshCw, Award, CheckCircle, AlertTriangle,
  ChevronRight, ArrowLeft, Loader2, MessageSquare, Sparkles,
  HelpCircle, StopCircle, FastForward, Video, VideoOff,
  Eye, EyeOff, Maximize, ShieldAlert, User, ShieldCheck,
  ChevronDown, RotateCcw, AlertOctagon
} from 'lucide-react';
import { registerMediaStream, stopAllHardwareMedia } from '@/lib/hardwareMedia';

// Play subtle warning audio chime using Web Audio API
function playAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

import dynamic from 'next/dynamic';

// 3D React Three Fiber Interactive Interviewer Avatar
const InterviewerAvatar3D = dynamic(() => import('@/components/InterviewerAvatar3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#0d0d12' }} />
  )
});

function stripAcousticEcho(candidateText, questionText) {
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
  const clauses = questionText.split(/[.?!]+/).map(s => s.trim().toLowerCase()).filter(s => s.length >= 30);
  for (const clause of clauses) {
    const idx = cleaned.toLowerCase().indexOf(clause);
    if (idx !== -1 && cleaned.length > clause.length + 5) {
      cleaned = (cleaned.slice(0, idx) + ' ' + cleaned.slice(idx + clause.length)).trim();
    }
  }

  return cleaned.replace(/\s+/g, ' ').replace(/^[,.;!?-]+\s*/, '').trim();
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const interviewId = params?.id;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Full-Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Proctoring Video, Audio & Candidate Presence
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [candidateInFrame, setCandidateInFrame] = useState(true);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const outOfFrameCountRef = useRef(0);
  const lastInfractionTimestampRef = useRef(0);

  // Overall Interview Timer
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Per-Question Response Timer (90 seconds limit)
  const QUESTION_TIME_LIMIT = 90;
  const [answerTimeLeft, setAnswerTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [silenceSeconds, setSilenceSeconds] = useState(0);
  const answerTimerRef = useRef(null);

  // Candidate Speech-to-Text (STT) - Always-On Microphone
  const [transcript, setTranscript] = useState('');
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedAudioChunksRef = useRef([]);
  const untranscribedChunksRef = useRef([]);
  const lastVoiceTimestampRef = useRef(0);
  const hasNewAudioDataRef = useRef(false);
  const recognitionRef = useRef(null);
  const handleSkipRef = useRef(null);
  const handleSubmitAnswerRef = useRef(null);
  const handleQuestionTimeoutRef = useRef(null);
  const isCleanedUpRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const lastAiSpeechEndedAtRef = useRef(0);
  const lastSpokenSpeechTimestampRef = useRef(0);
  const accumulatedTranscriptRef = useRef('');
  const currentInterviewerQuestionRef = useRef('');
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);

  // Voice Synthesis (AI TTS)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [speechPulse, setSpeechPulse] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.05);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const lastSpokenMessageIdRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const speechSafetyTimeoutRef = useRef(null);

  // Load preferred voice and speed configured during setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVoice = localStorage.getItem('preferred_interview_voice');
    const savedSpeed = localStorage.getItem('preferred_interview_speed');
    if (savedVoice) setSelectedVoiceUri(savedVoice);
    if (savedSpeed) setVoiceSpeed(parseFloat(savedSpeed));
  }, []);

  // Bulletproof Media Stream & Hardware Release
  const releaseAllMedia = useCallback(() => {
    isCleanedUpRef.current = true;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject && videoRef.current.srcObject.getTracks) {
        try {
          videoRef.current.srcObject.getTracks().forEach(track => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
        } catch (e) {}
      }
      videoRef.current.srcObject = null;
      try { videoRef.current.pause(); } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
    activeUtteranceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    stopAllHardwareMedia();
    setCameraActive(false);
  }, []);

  const releaseAllMediaRef = useRef(releaseAllMedia);
  releaseAllMediaRef.current = releaseAllMedia;

  // Guarantee all hardware is powered down ONLY when leaving the page (true unmount)
  useEffect(() => {
    const handleUnload = () => {
      releaseAllMediaRef.current();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      releaseAllMediaRef.current();
    };
  }, []);

  // Finish interview and navigate to scorecard
  const handleFinishInterview = useCallback(async (reason = '') => {
    if (finishing) return;
    setFinishing(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    // Stop all camera and mic hardware instantly
    releaseAllMedia();

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
  }, [finishing, interviewId, releaseAllMedia, router, toast]);

  // Handle Proctoring Infraction (3 Warnings Rule)
  const handleInfraction = useCallback((description) => {
    const now = Date.now();
    // Debounce duplicate infractions within 3 seconds
    if (now - lastInfractionTimestampRef.current < 3000) return;
    lastInfractionTimestampRef.current = now;

    setProctorWarnings((prev) => {
      const next = prev + 1;
      playAlertChime();

      if (next >= 3) {
        toast.error(`🚫 Disqualified: 3 proctoring infractions reached (${description}). Finalizing session...`);
        handleFinishInterview(`Session terminated: 3 infractions (${description})`);
        return 3;
      } else if (next === 2) {
        toast.warning(`⚠️ FINAL WARNING (2 of 3): ${description}! Next violation will automatically conclude your interview.`);
      } else {
        toast.warning(`⚠️ Proctor Warning (1 of 3): ${description}! Please stay focused on the interview.`);
      }
      return next;
    });
  }, [handleFinishInterview, toast]);

  // Request full-screen mode
  const requestFullScreenMode = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed or blocked:', err);
    }
  }, []);

  // Engage Full-Screen mode automatically on first candidate click gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      if (!document.fullscreenElement && session && session.status !== 'COMPLETED') {
        requestFullScreenMode();
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    return () => window.removeEventListener('click', handleFirstGesture);
  }, [session, requestFullScreenMode]);

  // Monitor Full-Screen changes & Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFull);
      if (!isCurrentlyFull && session && session.status !== 'COMPLETED' && !finishing) {
        setShowExitConfirmModal(true);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitConfirmModal(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [session, finishing]);

  // Monitor Tab Switch & Window Blur: Proctoring Alert
  useEffect(() => {
    const handleBlur = () => {
      if (session && session.status !== 'COMPLETED' && !finishing) {
        handleInfraction('Window blur / switched application');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && session && session.status !== 'COMPLETED' && !finishing) {
        handleInfraction('Switched browser tab or minimized window');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, finishing, handleInfraction]);

  // Robust Camera & Microphone Acquisition
  const startCameraAndMic = useCallback(async () => {
    try {
      isCleanedUpRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => {
          try {
            t.stop();
            t.enabled = false;
          } catch (e) {}
        });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
        }
      });

      if (isCleanedUpRef.current) {
        stream.getTracks().forEach(t => {
          try {
            t.stop();
            t.enabled = false;
          } catch (e) {}
        });
        return;
      }

      mediaStreamRef.current = stream;
      registerMediaStream(stream);

      // Listen for unexpected hardware track termination
      const videoTrack = stream.getVideoTracks()?.[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn('Video track stopped by hardware or browser permissions.');
          setCameraActive(false);
          setCandidateInFrame(false);
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Extract PURE audio track for speech recording & Whisper transcription
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks);
        registerMediaStream(audioStream);

        // Set up AudioContext for real-time volume meter
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(audioStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeter = () => {
            if (!mediaStreamRef.current || isCleanedUpRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const currentLvl = Math.min(100, Math.round(avg * 1.8));
            setAudioLevel(currentLvl);

            // Audio level > 16 indicates audible candidate speech
            if (currentLvl > 16 && !isAiSpeakingRef.current && (Date.now() - lastAiSpeechEndedAtRef.current > 400)) {
              hasNewAudioDataRef.current = true;
              lastVoiceTimestampRef.current = Date.now();
            }

            requestAnimationFrame(updateAudioMeter);
          };
          updateAudioMeter();
        } catch (audioErr) {
          console.warn('AudioContext visualization setup error:', audioErr);
        }

        // Initialize MediaRecorder with pure audio stream
        try {
          const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

          const recorder = new MediaRecorder(audioStream, { mimeType });
          recordedAudioChunksRef.current = [];
          untranscribedChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              // Acoustic isolation: Never accumulate chunks while AI is speaking or decaying
              if (isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
                return;
              }
              recordedAudioChunksRef.current.push(e.data);
              untranscribedChunksRef.current.push(e.data);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(1000); // 1-second timeslices
        } catch (recErr) {
          console.warn('MediaRecorder init error:', recErr);
        }
      }

    } catch (err) {
      console.warn('Camera/Mic access error:', err);
      setCameraActive(false);
      toastRef.current?.error('Could not access Camera/Microphone. Ensure hardware permissions are granted.');
    }
  }, []);

  // Initialize camera and mic once when component mounts
  useEffect(() => {
    startCameraAndMic();
  }, [startCameraAndMic]);

  // Attach stream to video whenever videoRef mounts or loading finishes
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      node.srcObject = mediaStreamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!loading && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [loading, cameraActive]);

  // Frame Presence & Proctoring Detection Loop (Face In Frame Check)
  useEffect(() => {
    if (!cameraActive) return;

    const frameInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // 1. Try native browser FaceDetector API if available
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          if (faces && faces.length > 0) {
            setCandidateInFrame(true);
            outOfFrameCountRef.current = 0;
            return;
          }
        } catch (e) {}
      }

      // 2. YCbCr Chromatic Skin Cluster Detection (Peer & Kovac algorithm)
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, 80, 60);
        const frame = ctx.getImageData(0, 0, 80, 60);

        let skinPixels = 0;
        let totalCenterPixels = 0;

        for (let y = 12; y < 48; y++) {
          for (let x = 18; x < 62; x++) {
            const idx = (y * 80 + x) * 4;
            const r = frame.data[idx];
            const g = frame.data[idx + 1];
            const b = frame.data[idx + 2];

            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            const isSkin = (
              cb >= 77 && cb <= 127 &&
              cr >= 133 && cr <= 173 &&
              r > 80 && g > 35 && b > 20 &&
              r > g && r > b &&
              (Math.max(r, g, b) - Math.min(r, g, b) > 12)
            );

            if (isSkin) skinPixels++;
            totalCenterPixels++;
          }
        }

        const skinRatio = skinPixels / (totalCenterPixels || 1);
        const isPresent = skinRatio >= 0.035;

        if (isPresent) {
          setCandidateInFrame(true);
          outOfFrameCountRef.current = 0;
        } else {
          // Only count out of frame if video is live and actually streaming
          const videoTrack = mediaStreamRef.current?.getVideoTracks()?.[0];
          if (videoTrack && videoTrack.readyState === 'live' && video.readyState >= 2) {
            setCandidateInFrame(false);
            outOfFrameCountRef.current += 1;

            // If out of frame for ~7.2 consecutive seconds (6 intervals of 1.2s)
            if (outOfFrameCountRef.current >= 6) {
              outOfFrameCountRef.current = 0;
              handleInfraction('Candidate out of camera frame');
            }
          }
        }
      } catch (e) {
        // frame analysis skipped
      }
    }, 1200);

    return () => clearInterval(frameInterval);
  }, [cameraActive, handleInfraction]);

  // Live continuous speech transcription via Groq Whisper (runs seamlessly in Brave & all browsers)
  useEffect(() => {
    if (!cameraActive || isAiSpeaking || isAiSpeakingRef.current) return;

    const transcribeInterval = setInterval(async () => {
      // Complete lockout while AI speaks or while acoustic reverberation decays
      if (isTranscribingAudio || isAiSpeaking || isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
        untranscribedChunksRef.current = [];
        return;
      }
      const now = Date.now();
      const timeSinceVoice = now - lastVoiceTimestampRef.current;
      const chunks = untranscribedChunksRef.current;

      // When candidate spoke and paused for 1.2s OR has been speaking continuously for 4+ seconds
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
                setTranscript(prev => {
                  const cleanPrev = prev.trim();
                  if (!cleanPrev) return newText;
                  if (cleanPrev.toLowerCase().includes(newText.toLowerCase())) return cleanPrev;
                  return `${cleanPrev} ${newText}`;
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
  }, [cameraActive, isAiSpeaking, isTranscribingAudio]);

  // Transcribe recorded audio chunks via Groq Whisper API
  const transcribeAudioViaWhisper = useCallback(async () => {
    if (recordedAudioChunksRef.current.length === 0) return '';
    setIsTranscribingAudio(true);

    try {
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const audioBlob = new Blob(recordedAudioChunksRef.current, { type: mimeType });
      if (audioBlob.size < 400) return '';

      const formData = new FormData();
      formData.append('audio', audioBlob, 'candidate_answer.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.text) {
        return data.text.trim();
      }
    } catch (err) {
      console.warn('Whisper transcription error:', err);
    } finally {
      setIsTranscribingAudio(false);
    }
    return '';
  }, []);

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
  }, [interviewId, router, toast]);

  // Overall Interview Countdown Timer
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
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, session, finishing, handleFinishInterview]);

  // Per-Question Response Timer (90s limit)
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
  }, [loading, session, finishing, isAiSpeaking]);

  // Reset silence counter when candidate speaks
  useEffect(() => {
    if (audioLevel > 15 || transcript.length > 0) {
      setSilenceSeconds(0);
    }
  }, [audioLevel, transcript]);

  // Emergency interrupt function allowing candidate to immediately answer
  const interruptAiAndAnswer = useCallback(() => {
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
    activeUtteranceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    lastAiSpeechEndedAtRef.current = Date.now();
    isAiSpeakingRef.current = false;
    setIsAiSpeaking(false);
    setSpeechPulse(0);
    lastVoiceTimestampRef.current = Date.now();
    setSilenceSeconds(0);
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    recordedAudioChunksRef.current = [];
    untranscribedChunksRef.current = [];

    // Immediately start speech recognition for candidate's answer
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
    toastRef.current?.info('Microphone ready! Speak your answer now.');
  }, []);

  // Text-To-Speech function for AI Interviewer with Complete Acoustic Isolation & GC Guard
  const speakText = useCallback((text) => {
    if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      // 1. Immediately flag AI as speaking to lock out mic
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);
      currentInterviewerQuestionRef.current = text.trim();

      // Clear any prior safety timeout
      if (speechSafetyTimeoutRef.current) {
        clearTimeout(speechSafetyTimeoutRef.current);
        speechSafetyTimeoutRef.current = null;
      }

      // 2. Abort any active speech recognition immediately to prevent capturing speaker audio
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      // 3. Purge transcript and audio buffers so AI voice never leaks
      setTranscript('');
      accumulatedTranscriptRef.current = '';
      lastSpokenSpeechTimestampRef.current = 0;
      recordedAudioChunksRef.current = [];
      untranscribedChunksRef.current = [];
      setAutoSubmitCountdown(null);

      try { window.speechSynthesis.cancel(); } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance; // CRITICAL: Prevent V8 GC in Brave/Chrome
      utterance.rate = voiceSpeed;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice = voices.find(v => v.voiceURI === selectedVoiceUri);
      if (!chosenVoice) {
        chosenVoice = voices.find(v =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Guy')) &&
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));
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
        lastAiSpeechEndedAtRef.current = Date.now();
        setSpeechPulse(0);

        // Cooldown timer (400ms) to allow speaker physical soundwave to completely decay in the room
        setTimeout(() => {
          setTranscript('');
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

          // Safely restart recognition for the candidate's turn
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 400);
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error or dropped:', err);
        handleSpeechEnd();
      };

      // Safety fallback: If Brave drops onend, automatically release intercom after estimated speech duration
      const wordCount = (text || '').split(/\s+/).filter(Boolean).length;
      const estimatedSecs = Math.max(3.5, (wordCount / (2.2 * Math.max(0.7, voiceSpeed))) + 1.8);
      speechSafetyTimeoutRef.current = setTimeout(() => {
        if (isAiSpeakingRef.current) {
          console.warn('TTS safety duration reached, unlocking microphone.');
          handleSpeechEnd();
        }
      }, Math.round(estimatedSecs * 1000));

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      setSpeechPulse(0);
    }
  }, [isAudioMuted, voiceSpeed, selectedVoiceUri]);

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
    if (lastMsg && lastMsg.role === 'interviewer' && lastMsg.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = lastMsg.id;
      speakText(lastMsg.content);
    }
  }, [session, speakText]);

  // Web Speech Recognition with Acoustic Isolation & Echo Filter
  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        // STRICT GUARD: If AI is speaking or within acoustic reverberation cooldown, discard everything
        if (isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
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
          lastSpokenSpeechTimestampRef.current = Date.now();
        }

        const lower = full.toLowerCase();
        if (lower.includes('skip question') || lower.includes('skip this question')) {
          handleSkipRef.current?.('[Candidate requested to skip via voice]');
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'network' && event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition info:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart recognition so Chrome never goes deaf after pauses
        if (!isAiSpeakingRef.current && !isCleanedUpRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      recognitionRef.current = recognition;

      // Start recognition only when AI is idle
      if (!isAiSpeaking && !isAiSpeakingRef.current) {
        try { recognition.start(); } catch (e) {}
      }
    } catch (e) {
      console.warn('Speech recognition init bypassed:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [isAiSpeaking]);

  // Submit candidate answer (transcribes audio if needed, then submits)
  const handleSubmitAnswer = useCallback(async (manualText = null) => {
    if (sendingAnswer) return;

    let answerText = (manualText !== null && typeof manualText === 'string')
      ? manualText.trim()
      : transcript.trim();

    // If answerText is empty but candidate recorded audio chunks, transcribe with Whisper turbo
    if (!answerText && recordedAudioChunksRef.current.length > 0) {
      setIsTranscribingAudio(true);
      try {
        const whisperText = await transcribeAudioViaWhisper();
        if (whisperText) {
          answerText = whisperText;
          setTranscript(whisperText);
        }
      } catch (err) {
        console.warn('Fallback Whisper error:', err);
      } finally {
        setIsTranscribingAudio(false);
      }
    }

    // Filter out echoed interviewer question if speaker sound leaked through mic
    if (currentInterviewerQuestionRef.current) {
      answerText = stripAcousticEcho(answerText, currentInterviewerQuestionRef.current);
    }

    if (!answerText || answerText.length < 5 || answerText.split(/\s+/).filter(Boolean).length < 2) {
      toast.warning('No speech detected yet. Speak your answer into your microphone.');
      return;
    }

    setSendingAnswer(true);
    setAutoSubmitCountdown(null);

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: answerText,
          elapsedSeconds,
          isSkip: false,
          proctoringWarnings: proctorWarnings
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        setTranscript('');
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
  }, [sendingAnswer, transcript, transcribeAudioViaWhisper, interviewId, elapsedSeconds, proctorWarnings, toast]);

  handleSubmitAnswerRef.current = handleSubmitAnswer;

  // Skip Question / Transition
  const handleSkipQuestion = useCallback(async (reasonMessage = '[Candidate skipped question]') => {
    if (sendingAnswer) return;

    setTranscript('');
    accumulatedTranscriptRef.current = '';
    lastSpokenSpeechTimestampRef.current = 0;
    recordedAudioChunksRef.current = [];
    untranscribedChunksRef.current = [];
    setSendingAnswer(true);
    setAutoSubmitCountdown(null);

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reasonMessage,
          elapsedSeconds,
          isSkip: true,
          proctoringWarnings: proctorWarnings
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
  }, [sendingAnswer, interviewId, elapsedSeconds, proctorWarnings]);

  handleSkipRef.current = handleSkipQuestion;

  // Answer Time Window Expired Handler
  const handleQuestionTimeout = useCallback(() => {
    if (sendingAnswer || isAiSpeaking) return;

    const currentText = transcript.trim();
    // 1. If candidate spoke something substantive, auto-submit their thoughts
    if (currentText.length >= 15 && currentText.split(/\s+/).filter(Boolean).length >= 3) {
      toast.info('Answer time window reached. Submitting your spoken response...', { icon: '⏱️' });
      handleSubmitAnswer(currentText);
      return;
    }

    // 2. Candidate did not answer: verbal AI transition without popup spam
    speakText("Time is up for this question. Let's move on to the next question.");
    handleSkipQuestion('[Time limit expired for this question - advancing to next topic]');
  }, [sendingAnswer, isAiSpeaking, transcript, speakText, handleSubmitAnswer, handleSkipQuestion, toast]);

  handleQuestionTimeoutRef.current = handleQuestionTimeout;

  // Hands-Free Conversational Voice Turn-Taking (Auto-Hearing & Auto-Submission)
  useEffect(() => {
    const vadInterval = setInterval(() => {
      if (isAiSpeakingRef.current || sendingAnswer || loading || !session || session.status === 'COMPLETED') {
        setAutoSubmitCountdown(null);
        return;
      }

      const currentText = transcript.trim();
      const realText = stripAcousticEcho(currentText, currentInterviewerQuestionRef.current);
      const wordCount = realText.split(/\s+/).filter(Boolean).length;

      // Has the candidate spoken an actual substantive answer?
      if (realText.length >= 15 && wordCount >= 3 && lastSpokenSpeechTimestampRef.current > 0) {
        const timeSinceWords = Date.now() - lastSpokenSpeechTimestampRef.current;

        // Candidate finished speaking and paused for 1.8 seconds: auto submit!
        if (timeSinceWords >= 1800) {
          setAutoSubmitCountdown(null);
          handleSubmitAnswerRef.current?.(realText);
        } else if (timeSinceWords >= 900) {
          // 0.9s pause: show visual countdown (submitting in 1s)
          setAutoSubmitCountdown(1);
        } else {
          setAutoSubmitCountdown(null);
        }
      } else {
        setAutoSubmitCountdown(null);
      }
    }, 200);

    return () => clearInterval(vadInterval);
  }, [loading, session, transcript, sendingAnswer]);

  // Keyboard shortcut: Press Enter to submit answer immediately if candidate has spoken
  useEffect(() => {
    const handleKeySubmit = (e) => {
      if (e.key === 'Enter' && !isAiSpeaking && !sendingAnswer && transcript.trim().length >= 10) {
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handleKeySubmit);
    return () => window.removeEventListener('keydown', handleKeySubmit);
  }, [isAiSpeaking, sendingAnswer, transcript, handleSubmitAnswer]);

  // Request Hint / Clarification
  const handleRequestHint = async () => {
    if (sendingAnswer) return;
    setSendingAnswer(true);
    const toastId = toast.loading('Asking interviewer for clarification...');

    try {
      const res = await apiFetch(`/api/interviews/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Could you clarify the technical requirements or provide a guiding hint on what architectural trade-offs you want me to evaluate?",
          elapsedSeconds,
          isSkip: false,
          proctoringWarnings: proctorWarnings
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSession(data.data);
        toast.success('Interviewer provided guidance', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error('Failed to get clarification', { id: toastId });
    } finally {
      setSendingAnswer(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = session?.messages?.slice().reverse().find(m => m.role === 'interviewer')?.content || 'Calibrating interview question...';
  const totalQuestionsAsked = session?.messages?.filter(m => m.role === 'interviewer').length || 1;
  const isTimeCritical = timeLeft < 180 && timeLeft > 0;

  // Hypnotic Spiral Loading Screen
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
      
      {/* Offscreen Canvas for Frame Presence Analysis */}
      <canvas ref={canvasRef} width="80" height="60" style={{ display: 'none' }} />

      {/* Exit / Conclude Confirmation Modal */}
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

      {/* Escape / Fullscreen Exit Confirmation Modal */}
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

      {/* TOP HUD BAR — Clean Minimalist Slate with Warnings Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          background: 'var(--surface-1, #101014)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => setShowFinishModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #a1a1ad)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem'
            }}
            title="Exit interview"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text, #f4f4f6)' }}>{session?.role}</span>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted, #a1a1ad)', fontWeight: 600 }}>
                {session?.experienceLevel}
              </span>
            </div>
            {session?.resumeTitle && session.resumeTitle !== 'Not provided' && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #a1a1ad)', marginTop: '2px' }}>
                Grounding Resume: <strong style={{ color: '#e4e4e7' }}>{session.resumeTitle}</strong>
              </div>
            )}
          </div>
        </div>

        {/* HUD Controls: Proctoring Warnings, Full Screen, Mute, Timer, Conclude */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          
          {/* Full Screen Mode Button */}
          <button
            onClick={requestFullScreenMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: isFullscreen ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 166, 35, 0.15)',
              border: `1px solid ${isFullscreen ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 166, 35, 0.4)'}`,
              color: isFullscreen ? '#34d399' : '#f5a623',
              cursor: 'pointer'
            }}
            title={isFullscreen ? 'In Full Screen mode' : 'Lock Full Screen mode'}
          >
            <Maximize size={13} />
            <span>{isFullscreen ? 'Full Screen' : 'Lock Full Screen'}</span>
          </button>

          {/* Proctoring Warnings Badge (3 Warnings Rule) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: proctorWarnings === 0
                ? 'rgba(52, 211, 153, 0.08)'
                : proctorWarnings === 1
                ? 'rgba(245, 166, 35, 0.12)'
                : 'rgba(248, 113, 113, 0.15)',
              border: `1px solid ${
                proctorWarnings === 0
                  ? 'rgba(52, 211, 153, 0.25)'
                  : proctorWarnings === 1
                  ? 'rgba(245, 166, 35, 0.35)'
                  : 'rgba(248, 113, 113, 0.45)'
              }`,
              color: proctorWarnings === 0 ? '#34d399' : proctorWarnings === 1 ? '#f5a623' : '#f87171'
            }}
          >
            <ShieldAlert size={13} />
            <span>Warnings: {proctorWarnings} / 3</span>
          </div>

          {/* AI Audio Mute Toggle */}
          <button
            onClick={() => {
              const next = !isAudioMuted;
              setIsAudioMuted(next);
              if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
              }
            }}
            style={{
              padding: '0.38rem 0.5rem',
              borderRadius: '6px',
              background: isAudioMuted ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: isAudioMuted ? 'var(--danger, #f87171)' : 'var(--text, #f4f4f6)',
              cursor: 'pointer'
            }}
            title={isAudioMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Session Countdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              background: isTimeCritical ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isTimeCritical ? '#f87171' : 'rgba(255, 255, 255, 0.08)'}`,
              color: isTimeCritical ? '#f87171' : '#f4f4f6',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            <Clock size={14} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Conclude Round CTA — Primary action White button #FAFAFA */}
          <button
            onClick={() => setShowFinishModal(true)}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              background: '#fafafa',
              border: 'none',
              color: '#09090b',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
            }}
          >
            <Award size={14} /> Conclude Round
          </button>
        </div>
      </div>

      {/* MAIN STAGE: TWO MATCHED EQUAL-HEIGHT SCREENS (AI SCREEN & CANDIDATE ANSWER SCREEN) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        
        {/* LEFT SCREEN: AI INTERVIEWER STAGE */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--surface-1, #101014)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '520px'
          }}
        >
          {/* AI Screen Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--ai, #a78bfa)',
                    boxShadow: '0 0 6px #a78bfa'
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ai, #a78bfa)' }}>
                  AI Technical Interviewer
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted, #a1a1ad)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px'
                }}
              >
                Question {totalQuestionsAsked}
              </span>
            </div>

            {/* 3D Avatar Centerpiece */}
            <div style={{ padding: '0.75rem 0 1rem', display: 'flex', justifyContent: 'center' }}>
              <InterviewerAvatar3D
                state={
                  isAiSpeaking
                    ? 'speaking'
                    : sendingAnswer
                    ? 'thinking'
                    : (audioLevel > 14 || (transcript && transcript.trim().length > 0))
                    ? 'listening'
                    : 'idle'
                }
                speechRhythm={speechPulse}
                audioLevel={audioLevel}
              />
            </div>
          </div>

          {/* Current Question Well */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              marginTop: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #a1a1ad)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current Question
              </span>

              <button
                onClick={() => speakText(currentQuestion)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #a1a1ad)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  padding: '0.15rem'
                }}
                title="Repeat question"
              >
                <Volume2 size={14} /> Repeat
              </button>
            </div>

            <div
              style={{
                fontSize: '1.02rem',
                lineHeight: 1.6,
                color: 'var(--text, #f4f4f6)',
                fontWeight: 500
              }}
            >
              {currentQuestion}
            </div>
          </div>
        </div>

        {/* RIGHT SCREEN: CANDIDATE ANSWER STAGE (VOICE-ONLY ANTI-CHEAT) */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--surface-1, #101014)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '520px'
          }}
        >
          {/* Top Bar: Live Cam Thumbnail & Response Timer */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: cameraActive && candidateInFrame ? 'var(--success, #34d399)' : 'var(--danger, #f87171)',
                    boxShadow: cameraActive && candidateInFrame ? '0 0 6px #34d399' : 'none'
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f4f4f6' }}>
                  Candidate Answer Stage (Voice-Only)
                </span>
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: isAiSpeaking ? 'rgba(167, 139, 250, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                    color: isAiSpeaking ? 'var(--ai, #a78bfa)' : 'var(--success, #34d399)',
                    border: `1px solid ${isAiSpeaking ? 'rgba(167, 139, 250, 0.25)' : 'rgba(52, 211, 153, 0.25)'}`
                  }}
                >
                  {isAiSpeaking ? 'AI SPEAKING' : 'MIC ALWAYS ON'}
                </span>
              </div>
            </div>

            {/* Compact Header Grid: Camera Thumbnail + Presence & Timer */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '0.85rem',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                marginBottom: '1rem'
              }}
            >
              {/* Webcam Video Preview */}
              <div
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '75px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#000000',
                  border: candidateInFrame ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f87171'
                }}
              >
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {!cameraActive && (
                  <button
                    type="button"
                    onClick={startCameraAndMic}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 15, 20, 0.9)',
                      color: '#f4f4f6',
                      border: 'none',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      zIndex: 3
                    }}
                    title="Click to reconnect camera hardware"
                  >
                    <VideoOff size={15} color="#f87171" />
                    <span>Reconnect Cam</span>
                  </button>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: candidateInFrame ? '#34d399' : '#f87171',
                    background: 'rgba(0, 0, 0, 0.75)',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    zIndex: 2
                  }}
                >
                  {candidateInFrame ? '● IN FRAME' : '⚠ OUT OF FRAME'}
                </div>
              </div>

              {/* Status Meters & Answer Timer Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-muted, #a1a1ad)' }}>Proctor Status</span>
                  <span style={{ fontWeight: 700, color: candidateInFrame ? '#34d399' : '#f87171' }}>
                    {candidateInFrame ? 'Candidate Present' : 'Candidate Missing!'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-muted, #a1a1ad)' }}>Answer Window</span>
                  <span style={{ fontWeight: 700, color: answerTimeLeft < 20 ? '#f87171' : '#f4f4f6' }}>
                    {answerTimeLeft}s
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(answerTimeLeft / QUESTION_TIME_LIMIT) * 100}%`,
                      height: '100%',
                      background: answerTimeLeft < 20 ? 'var(--danger, #f87171)' : 'var(--text, #fafafa)',
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Spoken Answer Stage (No Textarea — Anti-Cheat Pure Voice) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
              background: '#09090d',
              borderRadius: '12px',
              border: isAiSpeaking
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1.5px solid rgba(52, 211, 153, 0.35)',
              position: 'relative',
              minHeight: '180px',
              justifyContent: 'space-between'
            }}
          >
            {/* Audio Wave Visualizer & Live Mic Status Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Mic size={15} style={{ color: isAiSpeaking ? '#a1a1ad' : '#34d399' }} />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isAiSpeaking ? '#a1a1ad' : '#34d399' }}>
                    {isAiSpeaking ? 'Intercom Muted (AI Speaking)' : 'Microphone Listening...'}
                  </span>
                </div>

                {/* Live Volume Meter Bar */}
                {!isAiSpeaking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '14px' }}>
                    {[1, 2, 3, 4, 5, 6].map((bar) => {
                      const active = audioLevel > bar * 12;
                      return (
                        <div
                          key={bar}
                          style={{
                            width: '3px',
                            height: active ? `${Math.min(14, 4 + bar * 2)}px` : '4px',
                            background: active ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                            transition: 'height 0.1s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transcribed Candidate Speech Display */}
              <div style={{ minHeight: '80px', color: transcript ? '#ffffff' : '#71717a', fontSize: '0.94rem', lineHeight: 1.6, fontStyle: transcript ? 'normal' : 'italic' }}>
                {transcript ? (
                  <span>“{transcript}”</span>
                ) : isAiSpeaking ? (
                  <span>Listen closely to the interviewer’s question...</span>
                ) : (
                  <span>Speak your technical explanation naturally. Your voice is being continuously captured and transcribed...</span>
                )}
              </div>
            </div>

            {/* Helper Note & Audio Re-recording Option */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.72rem', color: '#a1a1ad', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mic size={12} style={{ color: '#34d399' }} /> Hands-Free Voice: Speak naturally. Answers are automatically heard & submitted when you pause.
              </span>

              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    recordedAudioChunksRef.current = [];
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #a1a1ad)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Clear spoken answer to re-record"
                >
                  <RotateCcw size={11} /> Clear & Re-speak
                </button>
              )}
            </div>
          </div>

          {/* Action Toolbar: Skip, Hint, Automatic Voice Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Skip Question Button */}
              <button
                onClick={() => handleSkipQuestion('[Candidate skipped question]')}
                disabled={sendingAnswer}
                style={{
                  padding: '0.6rem 0.95rem',
                  borderRadius: '8px',
                  background: 'rgba(245, 166, 35, 0.08)',
                  border: '1px solid rgba(245, 166, 35, 0.25)',
                  color: 'var(--accent, #f5a623)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: sendingAnswer ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Skip this question and move to the next topic"
              >
                <FastForward size={13} /> Skip
              </button>

              {/* Request Hint Button */}
              <button
                onClick={handleRequestHint}
                disabled={sendingAnswer}
                style={{
                  padding: '0.6rem 0.95rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted, #a1a1ad)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: sendingAnswer ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <HelpCircle size={13} /> Hint
              </button>
            </div>

            {/* Automatic Conversational Turn-Taking Status & Optional Shortcut */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isAiSpeaking ? (
                <button
                  type="button"
                  onClick={interruptAiAndAnswer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    background: 'rgba(167, 139, 250, 0.15)',
                    border: '1px solid rgba(167, 139, 250, 0.45)',
                    color: '#c084fc',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Click or press Spacebar to interrupt AI and answer now"
                >
                  <Volume2 size={14} /> AI Speaking (Click to Answer Now)
                </button>
              ) : sendingAnswer || isTranscribingAudio ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fafafa',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <Loader2 size={14} className="auth-spinner" /> Evaluating your technical answer...
                </div>
              ) : autoSubmitCountdown !== null ? (
                <button
                  onClick={() => handleSubmitAnswer()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    background: '#34d399',
                    border: 'none',
                    color: '#09090b',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(52, 211, 153, 0.3)'
                  }}
                  title="Pause detected. Submitting now (or click to send immediately)"
                >
                  <CheckCircle size={14} /> Submitting in {autoSubmitCountdown}s • Send Now ↵
                </button>
              ) : transcript.trim().length >= 15 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.52rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(52, 211, 153, 0.08)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      color: 'var(--success, #34d399)',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }} />
                    Listening... pause to submit
                  </div>
                  <button
                    onClick={() => handleSubmitAnswer()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.52rem 0.85rem',
                      borderRadius: '8px',
                      background: '#fafafa',
                      border: 'none',
                      color: '#09090b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
                    }}
                    title="Or submit immediately without waiting for pause"
                  >
                    <Send size={12} /> Send Now ↵
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#a1a1ad',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: audioLevel > 14 ? '#34d399' : '#71717a',
                      boxShadow: audioLevel > 14 ? '0 0 6px #34d399' : 'none'
                    }}
                  />
                  {audioLevel > 14 ? 'Hearing your voice...' : 'Auto-Hearing (Speak Naturally)'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT DIALOGUE / TRANSCRIPT HISTORY */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          background: 'var(--surface-1, #101014)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} style={{ color: 'var(--text-muted, #a1a1ad)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f4f4f6' }}>
              Recent Dialogue History
            </span>
          </div>

          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #a1a1ad)', fontWeight: 500 }}>
            {session?.messages?.length || 0} messages recorded
          </span>
        </div>

        {/* Chronological Message Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.35rem' }}>
          {session?.messages?.map((m) => {
            const isInterviewer = m.role === 'interviewer';
            return (
              <div
                key={m.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: isInterviewer ? 'rgba(167, 139, 250, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                  border: isInterviewer ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isInterviewer ? 'var(--ai, #a78bfa)' : 'var(--success, #34d399)'
                    }}
                  >
                    {isInterviewer ? 'AI Lead Interviewer' : 'Candidate (You)'}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', color: '#e4e4e7', lineHeight: 1.5 }}>
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
