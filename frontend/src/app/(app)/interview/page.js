'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import SpiralLoader from '@/components/SpiralLoader';
import ScheduleTaskModal from '@/components/ScheduleTaskModal';
import { stopAllHardwareMedia } from '@/lib/hardwareMedia';
import {
  PRESET_ROLES, EXPERIENCE_LEVELS, DURATIONS
} from './components/interviewConstants';
import InterviewHeader from './components/InterviewHeader';
import InterviewAudioSettingsBar from './components/InterviewAudioSettingsBar';
import InterviewRoleSelector from './components/InterviewRoleSelector';
import InterviewResumeGrounding from './components/InterviewResumeGrounding';
import InterviewParametersCard from './components/InterviewParametersCard';
import InterviewHistoryTab from './components/InterviewHistoryTab';
import PreflightCheckModal from './components/PreflightCheckModal';
import { usePreflightHardware } from './hooks/usePreflightHardware';

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    // Guarantee camera, mic, and speech recognition from any prior sessions are fully closed
    stopAllHardwareMedia();
  }, []);

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

  // Voice & Audio Settings state
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

  // Hardware hook
  const {
    showPreflightModal,
    setShowPreflightModal,
    camPermissionGranted,
    setCamPermissionGranted,
    micPermissionGranted,
    setMicPermissionGranted,
    faceDetectedInFrame,
    setFaceDetectedInFrame,
    micAudioLevel,
    preflightVideoRef,
    setPreflightVideoRef,
    preflightCanvasRef,
    openPreflightCheck,
    acquireHardwareStreams,
    stopPreflightStreams,
  } = usePreflightHardware({ selectedRoleId, customJD });

  // Load speech synthesis voices
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
    stopAllHardwareMedia();
  }, [loadData]);

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

  const handleConfirmAndStart = async () => {
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
    } catch {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', animation: 'fadeIn 0.25s ease-out' }}>
      <canvas ref={preflightCanvasRef} width="80" height="60" style={{ display: 'none' }} />

      {startingSession && (
        <SpiralLoader
          message="Preparing Your AI Interview Room..."
          subtext="Analyzing resume projects & calibrating neural voice"
        />
      )}

      <ConfirmModal
        open={!!deleteTargetId}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteSession}
        title="Delete this interview session?"
        message="This will permanently delete this interview session transcript and its scorecard. This action cannot be undone."
        confirmText="Delete Session"
        danger={true}
      />

      {/* Pre-Interview Calibration Modal */}
      <PreflightCheckModal
        isOpen={showPreflightModal}
        onClose={() => { stopPreflightStreams(); setShowPreflightModal(false); }}
        preflightVideoRef={preflightVideoRef}
        setPreflightVideoRef={setPreflightVideoRef}
        camPermissionGranted={camPermissionGranted}
        micPermissionGranted={micPermissionGranted}
        faceDetectedInFrame={faceDetectedInFrame}
        micAudioLevel={micAudioLevel}
        onConfirmAndStart={handleConfirmAndStart}
        onRetryPermissions={acquireHardwareStreams}
        onBypassCamera={() => {
          setCamPermissionGranted(false);
          setMicPermissionGranted(true);
          setFaceDetectedInFrame(true);
        }}
      />

      {/* Glass Header Banner */}
      <InterviewHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* SETUP TAB */}
      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', animation: 'fadeIn 0.2s ease-out' }}>
          <InterviewAudioSettingsBar
            selectedVoiceUri={selectedVoiceUri}
            handleVoiceChange={handleVoiceChange}
            availableVoices={availableVoices}
            previewVoiceSample={previewVoiceSample}
            voiceSpeed={voiceSpeed}
            handleSpeedChange={handleSpeedChange}
          />

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: 'var(--space-md)' 
          }}>
            <InterviewRoleSelector
              selectedRoleId={selectedRoleId}
              setSelectedRoleId={setSelectedRoleId}
              setSelectedRole={setSelectedRole}
              customJD={customJD}
              setCustomJD={setCustomJD}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <InterviewResumeGrounding
                resumeMode={resumeMode}
                setResumeMode={setResumeMode}
                vaultFiles={vaultFiles}
                selectedFileId={selectedFileId}
                setSelectedFileId={setSelectedFileId}
                setResumeText={setResumeText}
                uploadedFileName={uploadedFileName}
                resumeText={resumeText}
                handleFileUpload={handleFileUpload}
                uploadingResume={uploadingResume}
              />

              <InterviewParametersCard
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                onOpenPreflight={openPreflightCheck}
                startingSession={startingSession}
                uploadingResume={uploadingResume}
                onOpenSchedule={() => setShowScheduleModal(true)}
              />
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

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <InterviewHistoryTab
          sessions={sessions}
          loadingHistory={loadingHistory}
          onStartNew={() => { setActiveTab('setup'); router.push('/interview', { scroll: false }); }}
          onDeleteSession={(id) => setDeleteTargetId(id)}
        />
      )}
    </div>
  );
}
