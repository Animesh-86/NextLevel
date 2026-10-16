'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import SpiralLoader from '@/components/SpiralLoader';
import ScheduleTaskModal from '@/components/ScheduleTaskModal';
import {
  Mic, Clock, Briefcase, FileText, Upload, Sparkles,
  ChevronRight, Award, Trash2, Play, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, UserCheck, ShieldCheck,
  Video, VideoOff, Eye, RefreshCw, Volume2, Settings2, X, CalendarDays, Trophy
} from 'lucide-react';
import { registerMediaStream, stopAllHardwareMedia } from '@/lib/hardwareMedia';

const PRESET_ROLES = [
  { id: 'backend-java', title: 'Backend Engineer (Java / Spring Boot)', category: 'Backend' },
  { id: 'fullstack-react-spring', title: 'Full Stack Engineer (React + Spring Boot / Node)', category: 'Full Stack' },
  { id: 'frontend-react', title: 'Frontend Engineer (React / Next.js)', category: 'Frontend' },
  { id: 'system-design', title: 'System Design & Distributed Systems', category: 'Architecture' },
  { id: 'devops-cloud', title: 'DevOps & Cloud Engineer', category: 'Infra' },
  { id: 'ml-ai-engineer', title: 'AI / Machine Learning Engineer', category: 'AI & Data' },
  { id: 'behavioral-leadership', title: 'Behavioral & Leadership (STAR Method)', category: 'Behavioral' },
  { id: 'custom-jd', title: 'Custom Role / Target Job Description', category: 'Custom' }
];

const EXPERIENCE_LEVELS = [
  { value: 'Entry-Level / Intern', label: 'Entry / Intern' },
  { value: 'Mid-Level', label: 'Mid-Level' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead / Staff', label: 'Lead / Staff' }
];

const DURATIONS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '60 min' }
];

const VOICE_SPEEDS = [
  { value: 0.9, label: '0.9x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.05, label: '1.05x' },
  { value: 1.15, label: '1.15x' }
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'history'

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'history') {
      setActiveTab('history');
    } else if (tab === 'setup') {
      setActiveTab('setup');
    }
  }, [searchParams]);

  const [selectedRole, setSelectedRole] = useState(PRESET_ROLES[0].title);
  const [selectedRoleId, setSelectedRoleId] = useState(PRESET_ROLES[0].id);
  const [customJD, setCustomJD] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[1].value);
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Voice & Audio Settings state (configured BEFORE interview)
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.05);

  // Resume selection state
  const [vaultFiles, setVaultFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeMode, setResumeMode] = useState('vault');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Sessions history
  const [sessions, setSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Pre-Interview Calibration Modal State
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [preflightCamStream, setPreflightCamStream] = useState(null);
  const [camPermissionGranted, setCamPermissionGranted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [faceDetectedInFrame, setFaceDetectedInFrame] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const preflightVideoRef = useRef(null);
  const preflightCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const preflightStreamRef = useRef(null);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      const list = englishVoices.length > 0 ? englishVoices : allVoices;
      setAvailableVoices(list);

      const savedVoice = localStorage.getItem('preferred_interview_voice');
      if (savedVoice && list.some(v => v.voiceURI === savedVoice)) {
        setSelectedVoiceUri(savedVoice);
      } else {
        const natural = list.find(v =>
          v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Jenny')
        ) || list[0];
        if (natural) setSelectedVoiceUri(natural.voiceURI);
      }

      const savedSpeed = localStorage.getItem('preferred_interview_speed');
      if (savedSpeed) setVoiceSpeed(parseFloat(savedSpeed));
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleVoiceChange = (uri) => {
    setSelectedVoiceUri(uri);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_interview_voice', uri);
    }
  };

  const handleSpeedChange = (speed) => {
    setVoiceSpeed(speed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_interview_speed', speed.toString());
    }
  };

  const previewVoiceSample = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hello Animesh, I will be conducting your technical mock interview today.");
      utterance.rate = voiceSpeed;
      utterance.pitch = 1.0;
      const targetVoice = availableVoices.find(v => v.voiceURI === selectedVoiceUri);
      if (targetVoice) utterance.voice = targetVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice preview error:', e);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [filesRes, interviewsRes] = await Promise.all([
        apiFetch('/api/files'),
        apiFetch('/api/interviews')
      ]);

      const filesData = await filesRes.json();
      if (filesData.success && Array.isArray(filesData.data)) {
        setVaultFiles(filesData.data);
        const resumeFile = filesData.data.find(f => f.fileName?.toLowerCase().includes('resume'));
        if (resumeFile) {
          setSelectedFileId(resumeFile.id || resumeFile._id);
        }
      }

      const interviewsData = await interviewsRes.json();
      if (interviewsData.success && Array.isArray(interviewsData.data)) {
        setSessions(interviewsData.data);
      }
    } catch (err) {
      console.error('Failed to load interview setup data:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Guarantee any lingering camera or microphone hardware locks from prior sessions are closed
    stopAllHardwareMedia();
  }, [loadData]);

  // Clean up preflight hardware streams
  const stopPreflightStreams = useCallback(() => {
    stopAllHardwareMedia();
    if (preflightStreamRef.current) {
      preflightStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
          t.enabled = false;
        } catch (e) {}
      });
      preflightStreamRef.current = null;
    }
    if (preflightVideoRef.current) {
      if (preflightVideoRef.current.srcObject && preflightVideoRef.current.srcObject.getTracks) {
        try {
          preflightVideoRef.current.srcObject.getTracks().forEach(t => {
            try { t.stop(); t.enabled = false; } catch (e) {}
          });
        } catch (e) {}
      }
      preflightVideoRef.current.srcObject = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setPreflightCamStream(null);
    setCamPermissionGranted(false);
    setMicPermissionGranted(false);
    setFaceDetectedInFrame(false);
  }, []);

  // Cleanup on unmount, page hide, or beforeunload
  useEffect(() => {
    const handleUnload = () => {
      stopPreflightStreams();
      stopAllHardwareMedia();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      stopPreflightStreams();
      stopAllHardwareMedia();
    };
  }, [stopPreflightStreams]);

  // Launch Pre-Interview Hardware Check
  const openPreflightCheck = async () => {
    if (selectedRoleId === 'custom-jd' && !customJD.trim()) {
      toast.error('Please enter a target job description or role details.');
      return;
    }

    setShowPreflightModal(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      preflightStreamRef.current = stream;
      registerMediaStream(stream);
      setPreflightCamStream(stream);
      setCamPermissionGranted(true);
      setMicPermissionGranted(true);

      if (preflightVideoRef.current) {
        preflightVideoRef.current.srcObject = stream;
        preflightVideoRef.current.play().catch(() => {});
      }

      // Audio activity monitor
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!preflightStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicAudioLevel(Math.min(100, Math.round(avg * 1.6)));
        requestAnimationFrame(updateVolume);
      };
      updateVolume();

    } catch (err) {
      console.warn('Preflight hardware permission error:', err);
      toast.error('Camera or Microphone access was denied. Please allow browser permissions to enter the proctored interview.');
      setCamPermissionGranted(false);
      setMicPermissionGranted(false);
    }
  };

  // Face presence & frame alignment detector loop in Preflight
  useEffect(() => {
    if (!showPreflightModal || !camPermissionGranted) return;

    const interval = setInterval(async () => {
      const video = preflightVideoRef.current;
      const canvas = preflightCanvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;

      // 1. Try native browser FaceDetector API if supported
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          if (faces && faces.length > 0) {
            setFaceDetectedInFrame(true);
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
        // Real candidate face occupies at least 4.5% of central frame pixels
        if (skinRatio >= 0.045) {
          setFaceDetectedInFrame(true);
        } else {
          setFaceDetectedInFrame(false);
        }
      } catch (e) {
        // frame analysis skipped
      }
    }, 700);

    return () => clearInterval(interval);
  }, [showPreflightModal, camPermissionGranted]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    const toastId = toast.loading(`Extracting resume text from ${file.name}...`);

    try {
      if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text();
        setResumeText(text);
        setUploadedFileName(file.name);
        toast.success(`Resume loaded (${file.name})`, { id: toastId });
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });
        const extractData = await extractRes.json();

        if (extractData.success && extractData.text) {
          setResumeText(extractData.text);
          setUploadedFileName(file.name);
          toast.success(`Resume parsed successfully (${file.name})`, { id: toastId });
        } else {
          throw new Error(extractData.error || 'Failed to extract text from file');
        }
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      toast.error(err.message || 'Failed to parse resume', { id: toastId });
    } finally {
      setUploadingResume(false);
    }
  };

  // Confirm readiness, request Fullscreen, initialize interview, and launch
  const handleConfirmAndStart = async () => {
    // 1. Enter full screen mode immediately in this user-click event context
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed by browser:', e);
    }

    stopPreflightStreams();
    setShowPreflightModal(false);
    setStartingSession(true);

    try {
      let finalResumeText = resumeText;

      if (resumeMode === 'vault' && selectedFileId && !finalResumeText) {
        try {
          const downloadRes = await apiFetch(`/api/files/${selectedFileId}/download`);
          if (downloadRes.ok) {
            const blob = await downloadRes.blob();
            const selectedFileObj = vaultFiles.find(f => (f.id || f._id) === selectedFileId);
            const fileName = selectedFileObj?.fileName || 'resume.pdf';
            const formData = new FormData();
            formData.append('file', blob, fileName);
            const extractRes = await fetch('/api/extract', {
              method: 'POST',
              body: formData
            });
            const extractData = await extractRes.json();
            if (extractData.success && extractData.text) {
              finalResumeText = extractData.text;
            }
          }
        } catch (e) {
          console.warn('Could not pre-extract vault resume text on frontend:', e);
        }
      }

      const payload = {
        role: selectedRoleId === 'custom-jd' ? 'Custom Role' : selectedRole,
        experienceLevel,
        durationMinutes,
        customRoleText: selectedRoleId === 'custom-jd' ? customJD.trim() : null,
        resumeFileId: resumeMode === 'vault' && selectedFileId ? selectedFileId : null,
        resumeText: finalResumeText || (resumeMode === 'upload' ? resumeText : null)
      };

      const res = await apiFetch('/api/interviews/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data?.id) {
        router.push(`/interview/${data.data.id}`);
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (err) {
      console.error('Start interview error:', err);
      toast.error(err.message || 'Error starting interview');
      setStartingSession(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTargetId) return;
    try {
      await apiFetch(`/api/interviews/${deleteTargetId}`, { method: 'DELETE' });
      toast.success('Interview session deleted');
      setDeleteTargetId(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  const chipStyle = (isActive) => ({
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: isActive ? '1px solid var(--accent-border)' : '1px solid var(--border-light)',
    background: isActive ? 'var(--accent-tint)' : 'rgba(255, 255, 255, 0.02)',
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Offscreen Canvas for Preflight analysis */}
      <canvas ref={preflightCanvasRef} width="80" height="60" style={{ display: 'none' }} />

      {startingSession && (
        <SpiralLoader
          message="Preparing Your AI Interview Room..."
          subtext="Analyzing resume projects & calibrating neural voice"
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTargetId}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteSession}
        title="Delete this interview session?"
        message="This will permanently delete this interview session transcript and its scorecard. This action cannot be undone."
        confirmText="Delete Session"
        danger={true}
      />

      {/* ─── PRE-INTERVIEW HARDWARE PERMISSION & CALIBRATION MODAL ─── */}
      {showPreflightModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              borderRadius: '16px',
              background: '#101014',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              padding: '1.75rem',
              color: '#f4f4f6',
              position: 'relative'
            }}
          >
            <button
              onClick={() => { stopPreflightStreams(); setShowPreflightModal(false); }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#a1a1ad',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent, #f5a623)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                <ShieldCheck size={14} /> Pre-Interview Calibration
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Camera & Audio Verification
              </h2>
              <p style={{ color: '#a1a1ad', fontSize: '0.84rem', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
                Permissions are required before the session begins. Verify that you are clearly visible in the camera frame and your microphone is picking up your voice.
              </p>
            </div>

            {/* Video Mirror Tile */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 10',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#08080a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <video
                ref={preflightVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />

              {!camPermissionGranted && (
                <div style={{ position: 'absolute', textAlign: 'center', padding: '1rem' }}>
                  <VideoOff size={32} style={{ color: '#f87171', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Camera permission needed</div>
                  <div style={{ fontSize: '0.75rem', color: '#a1a1ad', marginTop: '2px' }}>Please grant browser camera & mic access when prompted</div>
                </div>
              )}

              {camPermissionGranted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    background: faceDetectedInFrame ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                    color: faceDetectedInFrame ? '#34d399' : '#f87171',
                    border: `1px solid ${faceDetectedInFrame ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: faceDetectedInFrame ? '#34d399' : '#f87171' }} />
                  {faceDetectedInFrame ? '✓ Candidate In Frame' : '⚠ No Candidate Detected (Face Out of Frame)'}
                </div>
              )}
            </div>

            {/* Hardware Status List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {/* Mic Level Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.95rem', borderRadius: '8px', background: '#08080a', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>
                  <Mic size={15} style={{ color: micPermissionGranted ? '#34d399' : '#f87171' }} />
                  <span>Microphone: {micPermissionGranted ? 'Connected' : 'Waiting for access'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${micAudioLevel}%`, height: '100%', background: '#34d399', transition: 'width 0.1s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#a1a1ad', width: '28px' }}>{micAudioLevel}%</span>
                </div>
              </div>

              {/* Proctor Notice */}
              <div style={{ fontSize: '0.76rem', color: '#a1a1ad', lineHeight: 1.4, padding: '0 0.25rem' }}>
                • When you enter, the interview will automatically lock into <strong>Full Screen Mode</strong>.<br />
                • The side panel will be hidden and <strong>3 warnings</strong> are allotted for tab switches or leaving camera frame before auto-submission.
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              onClick={handleConfirmAndStart}
              disabled={!camPermissionGranted || !micPermissionGranted || !faceDetectedInFrame}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                background: camPermissionGranted && micPermissionGranted && faceDetectedInFrame ? '#fafafa' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: camPermissionGranted && micPermissionGranted && faceDetectedInFrame ? '#09090b' : '#71717a',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: camPermissionGranted && micPermissionGranted && faceDetectedInFrame ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: camPermissionGranted && micPermissionGranted && faceDetectedInFrame ? '0 4px 18px rgba(255, 255, 255, 0.2)' : 'none'
              }}
            >
              {!faceDetectedInFrame
                ? 'Position Face in Frame to Enter'
                : 'Enter Proctored Room (Full Screen)'} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* Glass Header Banner with Integrated Mode Switcher Tabs */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
              AI Mock Interview
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: 0 }}>
              {activeTab === 'setup'
                ? 'Voice-interactive AI technical interviewer with resume project verification, proctoring, and comprehensive scorecards.'
                : 'Review your completed mock interviews, hiring scorecards, transcripts, and feedback.'}
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
              onClick={() => { setActiveTab('setup'); router.push('/interview', { scroll: false }); }}
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
                background: activeTab === 'setup' ? '#fafafa' : 'transparent',
                color: activeTab === 'setup' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                boxShadow: activeTab === 'setup' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={15} style={{ fill: activeTab === 'setup' ? '#09090b' : 'none', color: activeTab === 'setup' ? '#09090b' : 'currentColor' }} /> Practice Interview
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('history'); router.push('/interview?tab=history', { scroll: false }); }}
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
                background: activeTab === 'history' ? '#fafafa' : 'transparent',
                color: activeTab === 'history' ? '#09090b' : 'var(--text-muted, #a1a1ad)',
                boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Trophy size={15} style={{ color: activeTab === 'history' ? '#09090b' : 'currentColor' }} /> Interview Results & History
            </button>
          </div>
        </div>
      </header>

      {/* ─── TAB CONTENT: SETUP INTERVIEW ─── */}
      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', animation: 'fadeIn 0.2s ease-out' }}>
          {/* ─── TOP BAR: INTERVIEW AUDIO SETTINGS (Voice Selection & Speed BEFORE Interview) ─── */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-md)',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Volume2 size={18} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                Interviewer Audio Settings
              </span>
            </div>

            {/* Voice Selector & Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Voice Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Voice:</span>
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '220px'
                  }}
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI} style={{ background: '#101014', color: '#f4f4f6' }}>
                      {v.name.replace(/Microsoft|Google|English/gi, '').trim().substring(0, 22) || v.name.substring(0, 22)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={previewVoiceSample}
                  style={{
                    padding: '0.42rem 0.75rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#f4f4f6',
                    borderRadius: '6px'
                  }}
                  title="Test selected voice"
                >
                  <Play size={12} fill="#f4f4f6" color="#f4f4f6" /> Test
                </button>
              </div>

              {/* Speed Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Speed:</span>
                {VOICE_SPEEDS.map((sp) => (
                  <button
                    key={sp.value}
                    type="button"
                    onClick={() => handleSpeedChange(sp.value)}
                    style={{
                      padding: '0.32rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: voiceSpeed === sp.value ? '1px solid var(--accent, #f5a623)' : '1px solid var(--border-light)',
                      background: voiceSpeed === sp.value ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
                      color: voiceSpeed === sp.value ? 'var(--accent, #f5a623)' : 'var(--text-muted)'
                    }}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Two-Column Grid: Left Role Selector | Right Parameters & Actions ─── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: 'var(--space-md)' 
          }}>
            
            {/* Left: Role Selector */}
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Briefcase size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select Target Role</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                {PRESET_ROLES.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => { setSelectedRoleId(role.id); setSelectedRole(role.title); }}
                      style={{
                        padding: '0.85rem 1.1rem',
                        borderRadius: '10px',
                        background: isSelected ? 'var(--accent-tint, rgba(245, 166, 35, 0.1))' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isSelected ? 'var(--accent-border, rgba(245, 166, 35, 0.4))' : 'var(--border-light)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '52px',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {role.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {role.category}
                        </span>
                        {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--accent, #f5a623)' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRoleId === 'custom-jd' && (
                <div style={{ marginTop: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Paste Job Description or Requirements
                  </label>
                  <textarea
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                    placeholder="Paste the target job description (skills, responsibilities, company tech stack)..."
                    rows={4}
                    style={{
                      width: '100%', padding: '0.85rem 1rem',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                      borderRadius: '8px', color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                    }}
                  />
                </div>
              )}
            </section>

            {/* Right Column: Resume Grounding -> Level & Duration -> Begin CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              {/* 1. Resume Grounding */}
              <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                  <FileText size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Resume Grounding</h2>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                  The AI automatically extracts your real project names and metrics to ask tailored technical architecture questions.
                </p>

                {/* Mode Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { mode: 'vault', label: `From Vault (${vaultFiles.length})`, flex: 1 },
                    { mode: 'upload', label: 'Upload File', flex: 1 },
                    { mode: 'none', label: 'Skip Resume', flex: 0.8 }
                  ].map(({ mode, label, flex }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setResumeMode(mode)}
                      style={{
                        flex,
                        padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                        border: resumeMode === mode ? '1px solid var(--accent-border, rgba(245, 166, 35, 0.4))' : '1px solid var(--border-light)',
                        background: resumeMode === mode ? 'var(--accent-tint, rgba(245, 166, 35, 0.1))' : 'transparent',
                        color: resumeMode === mode ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}
                    >{label}</button>
                  ))}
                </div>

                {resumeMode === 'vault' && (
                  <div>
                    {vaultFiles.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        No files found in Vault. Switch to Upload File tab to upload your resume.
                      </p>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Select Resume Document
                        </label>
                        <select
                          value={selectedFileId}
                          onChange={(e) => { setSelectedFileId(e.target.value); setResumeText(''); }}
                          style={{
                            width: '100%', padding: '0.85rem 1rem',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                          }}
                        >
                          <option value="">-- Choose a document --</option>
                          {vaultFiles.map(f => (
                            <option key={f.id || f._id} value={f.id || f._id}>
                              {f.fileName || f.title} ({f.fileType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {resumeMode === 'upload' && (
                  <div>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '1.75rem', border: '1px dashed var(--accent-border, rgba(245, 166, 35, 0.4))', borderRadius: '8px',
                      background: 'var(--accent-tint, rgba(245, 166, 35, 0.08))', cursor: 'pointer'
                    }}>
                      <Upload size={24} style={{ color: 'var(--accent, #f5a623)', marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {uploadedFileName ? uploadedFileName : 'Upload Resume (PDF, DOCX, TXT)'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {resumeText ? '✓ Text extracted & ready for grounding' : 'Text is extracted in memory for AI project verification'}
                      </span>
                      <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingResume} />
                    </label>
                  </div>
                )}

                {resumeMode === 'none' && (
                  <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Standard industry questions will be generated for the role without project grounding.
                    </p>
                  </div>
                )}
              </section>

              {/* 2. Parameters & Duration */}
              <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <ShieldCheck size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Parameters & Duration</h2>
                </div>
                
                {/* Experience Level */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Seniority Level
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <button key={lvl.value} type="button" onClick={() => setExperienceLevel(lvl.value)} style={chipStyle(experienceLevel === lvl.value)}>
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Session Duration
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {DURATIONS.map((d) => (
                      <button key={d.minutes} type="button" onClick={() => setDurationMinutes(d.minutes)} style={chipStyle(durationMinutes === d.minutes)}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3. Launch Actions: Begin Mock Interview + Schedule in Planner */}
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={openPreflightCheck}
                  disabled={startingSession || uploadingResume}
                  className="btn btn-primary"
                  style={{
                    flex: '1 1 240px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: startingSession || uploadingResume ? 'not-allowed' : 'pointer',
                    opacity: startingSession || uploadingResume ? 0.7 : 1
                  }}
                >
                  <Mic size={18} /> Begin Mock Interview <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  disabled={startingSession}
                  className="btn"
                  style={{
                    padding: '1rem 1.4rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    cursor: startingSession ? 'not-allowed' : 'pointer'
                  }}
                  title="Schedule this mock interview in your Planner"
                >
                  <CalendarDays size={18} color="#ffffff" /> Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleTaskModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        defaultTitle={`Mock Interview: ${selectedRole}`}
        defaultDescription={`Technical AI mock interview for ${selectedRole} (${experienceLevel}, ${durationMinutes} min).`}
        defaultCategory="mock-interview"
        defaultDuration={durationMinutes}
      />

      {/* ─── TAB CONTENT: PAST INTERVIEWS HISTORY & SCORECARDS ─── */}
      {activeTab === 'history' && (
        <section style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f4f4f6' }}>
                Past Mock Interviews & Hiring Scorecards
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#a1a1ad', margin: '4px 0 0' }}>
                Review your technical evaluations, proctoring integrity, transcripts, and AI suggestions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a1a1ad', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                {sessions.length} {sessions.length === 1 ? 'SESSION' : 'SESSIONS'}
              </span>
              <button
                type="button"
                onClick={() => { setActiveTab('setup'); router.push('/interview', { scroll: false }); }}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={14} /> Start New Interview
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1ad' }}>
              <Loader2 size={24} className="auth-spinner" style={{ margin: '0 auto 0.5rem' }} />
              Loading history...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '16px', background: 'var(--surface-1, #101014)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f6' }}>No interviews completed yet.</div>
              <div style={{ fontSize: '0.82rem', color: '#71717a', marginTop: '6px', maxWidth: '420px', margin: '6px auto 1.5rem' }}>
                Launch your first voice-interactive technical mock interview to receive a full proctoring scorecard and actionable feedback.
              </div>
              <button
                type="button"
                onClick={() => { setActiveTab('setup'); router.push('/interview', { scroll: false }); }}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
              >
                <Play size={15} style={{ marginRight: '6px' }} /> Configure Mock Interview
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {sessions.map((sess) => {
                const hasScore = sess.scorecard && sess.scorecard.overallScore !== undefined;
                const isNotEval = !hasScore || sess.scorecard?.overallScore === 0;
                return (
                  <div
                    key={sess.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      background: 'var(--surface-1, #101014)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f4f4f6' }}>
                          {sess.role}
                        </div>
                        {hasScore && !isNotEval && (
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                            {sess.scorecard.overallScore}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#a1a1ad', marginTop: '3px' }}>
                        {sess.experienceLevel} • {sess.durationMinutes} min • {new Date(sess.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => router.push(sess.status === 'COMPLETED' ? `/interview/${sess.id}/scorecard` : `/interview/${sess.id}`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fafafa',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {sess.status === 'COMPLETED' ? 'View Scorecard' : 'Resume Session'} <ChevronRight size={13} />
                      </button>

                      <button
                        onClick={() => setDeleteTargetId(sess.id)}
                        style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
