'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import RoomKnockLoader from '@/components/RoomKnockLoader';
import { playAmbientSound, stopAmbientSound } from '@/lib/ambientSound';
import { exportSprintResultImage } from './utils/canvasResultExporter';

// Custom Hooks
import { useRoomData } from './hooks/useRoomData';
import { useRoomChat } from './hooks/useRoomChat';
import { useRoomDocumentUpload } from './hooks/useRoomDocumentUpload';
import { useRoomProctoring } from './hooks/useRoomProctoring';
import { useRoomGameplay } from './hooks/useRoomGameplay';
import { useRoomChallengeConfig } from './hooks/useRoomChallengeConfig';

// Modular UI Components
import RoomHeader from './components/RoomHeader';
import RoomStageSwitcher from './components/RoomStageSwitcher';
import RoomLeftStage from './components/RoomLeftStage';
import RoomChatRail from './components/RoomChatRail';
import RoomAllModals from './components/RoomAllModals';

export default function StudyRoomArena({ params }) {
  const { id: roomIdOrCode } = use(params);
  const router = useRouter();
  const toast = useToast();

  // Navigation tab & Zen Mode
  const [activeTab, setActiveTab] = useState('challenge');
  const [isZenMode, setIsZenMode] = useState(false);
  const [showPeersModal, setShowPeersModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Scratchpad
  const [sharedNotes, setSharedNotes] = useState(
    '# 📝 Study Room Shared Scratchpad\n\n- Meeting Goal: Master OA dynamic programming patterns\n- Problem 1 notes: DP state dp[i][j] represents max subarray profit\n- Code snippet:\n  const maxProfit = (prices) => { ... };\n'
  );
  const [scratchpadView, setScratchpadView] = useState('split');
  const [isScratchpadSaved, setIsScratchpadSaved] = useState(true);

  // Ambient Audio
  const [activeSound, setActiveSound] = useState('none');
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [showAudioPopover, setShowAudioPopover] = useState(false);

  // Pomodoro Focus Timer
  const [timerMode, setTimerMode] = useState('FOCUS');
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [pomodoroDurationMinutes, setPomodoroDurationMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState('WORK');
  const [focusSoundEnabled, setFocusSoundEnabled] = useState(true);
  const [customFocusInput, setCustomFocusInput] = useState('50');
  const [showCustomFocusInput, setShowCustomFocusInput] = useState(false);

  // Copy helpers
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Session Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  // Challenge Stage state
  const [stageState, setStageState] = useState('idle');

  // Chat Hook
  const chat = useRoomChat(roomIdOrCode);

  // Document Upload Hook
  const upload = useRoomDocumentUpload();

  // Room Data Hook
  const roomData = useRoomData({
    roomIdOrCode,
    router,
    stageState,
    setStageState,
    fetchMessages: chat.fetchMessages
  });

  // Proctoring Hook
  const proctoring = useRoomProctoring({
    stageState,
    setStageState,
    roomIdOrCode,
    currentUserName: roomData.currentUserName
  });

  const participantsList = roomData.room?.participants || [];

  // Gameplay Hook
  const gameplay = useRoomGameplay({
    roomIdOrCode,
    room: roomData.room,
    setRoom: roomData.setRoom,
    currentUserId: roomData.currentUserId,
    participantsList,
    stageState,
    setStageState,
    fetchRoomData: roomData.fetchRoomData,
    selectedExamIds: upload.selectedExamIds,
    setIsFullscreenActive: proctoring.setIsFullscreenActive,
    setIsProctoredActive: proctoring.setIsProctoredActive,
    resetProctoring: proctoring.resetProctoring
  });

  // Challenge Configuration Hook
  const challengeConfig = useRoomChallengeConfig({
    roomIdOrCode,
    room: roomData.room,
    setRoom: roomData.setRoom,
    selectedExamIds: upload.selectedExamIds,
    selectedExamId: upload.selectedExamId,
    customTitle: upload.customTitle,
    stageState,
    setStageState,
    fetchRoomData: roomData.fetchRoomData,
    fetchMessages: chat.fetchMessages,
    handleStartChallenge: gameplay.handleStartChallenge,
    resetGameplay: gameplay.resetGameplay
  });

  // Synchronized Pomodoro timer effect
  useEffect(() => {
    let timer;
    if (pomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            if (pomodoroPhase === 'WORK') {
              setPomodoroPhase('BREAK');
              toast.info('Focus block complete! Break phase active - head to Tech Bubble Pit! 🫧');
              return 300;
            } else {
              setPomodoroPhase('WORK');
              toast.info('Break over! Back to focus work. 🎯');
              return pomodoroDurationMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pomodoroRunning, pomodoroPhase, pomodoroDurationMinutes, toast]);

  // Audio Selection
  const handleSelectSound = soundType => {
    if (soundType === 'none' || (soundType === activeSound && soundPlaying)) {
      stopAmbientSound();
      setSoundPlaying(false);
      setActiveSound('none');
    } else {
      setActiveSound(soundType);
      playAmbientSound(soundType);
      setSoundPlaying(true);
    }
    setShowAudioPopover(false);
  };

  // Copy helpers
  const copyRoomCode = () => {
    if (!roomData.room) return;
    navigator.clipboard.writeText(roomData.room.roomCode);
    setCopiedCode(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Room link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Goal Save
  const handleSaveGoal = async e => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/goal?goal=${encodeURIComponent(goalInput.trim())}`, {
        method: 'PUT'
      });
      const json = await res.json();
      if (json.success) {
        roomData.setMyGoal(goalInput.trim());
        setShowGoalModal(false);
        toast.success('Focus goal updated!');
        roomData.fetchRoomData();
      }
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  // Image Download
  const handleDownloadResultImage = ch => {
    exportSprintResultImage(ch || roomData.room?.activeChallenge, roomData.room, toast);
  };

  const isHost = Boolean(roomData.room && roomData.currentUserId && roomData.room.hostUserId === roomData.currentUserId);
  const isChallengeActive = stageState === 'live_question' || stageState === 'checkpoint';
  const isChatCollapsed = isZenMode || activeTab === 'chat' || (isChallengeActive ? false : chat.chatCollapsedManually);
  const userInitials =
    (roomData.currentUserName || 'Student')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <RoomKnockLoader
      step={roomData.joinStep}
      joinStep={roomData.joinStep}
      room={roomData.room}
      loading={roomData.loading}
      code={roomData.room?.roomCode}
      name={roomData.room?.title}
      initials={userInitials}
      onRetry={() => roomData.fetchRoomData(true)}
      onCancel={() => router.push('/rooms')}
    >
      <div
        className="container"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0.75rem 1.25rem',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <RoomHeader
          room={roomData.room}
          roomIdOrCode={roomIdOrCode}
          copiedCode={copiedCode}
          copiedLink={copiedLink}
          copyRoomCode={copyRoomCode}
          copyRoomLink={copyRoomLink}
          expiryDisplay={roomData.expiryDisplay}
          isExpiryAmber={roomData.isExpiryAmber}
          showExpiryPopover={roomData.showExpiryPopover}
          setShowExpiryPopover={roomData.setShowExpiryPopover}
          handleExtendRoom={roomData.handleExtendRoom}
          handleAdjustRoomTimer={roomData.handleAdjustRoomTimer}
          isHost={isHost}
          participantsList={participantsList}
          setShowPeersModal={setShowPeersModal}
          isMicMuted={roomData.isMicMuted}
          isVideoOff={roomData.isVideoOff}
          isHandRaised={roomData.isHandRaised}
          toggleMic={roomData.toggleMic}
          toggleCamera={roomData.toggleCamera}
          handleRaiseHand={() => roomData.handleRaiseHand(chat.fetchMessages)}
          isZenMode={isZenMode}
          setIsZenMode={setIsZenMode}
          activeSound={activeSound}
          soundPlaying={soundPlaying}
          showAudioPopover={showAudioPopover}
          setShowAudioPopover={setShowAudioPopover}
          handleSelectSound={handleSelectSound}
          showMoreMenu={showMoreMenu}
          setShowMoreMenu={setShowMoreMenu}
          handleExitRoom={roomData.handleExitRoom}
          setShowCloseConfirmModal={roomData.setShowCloseConfirmModal}
          userInitials={userInitials}
        />

        {/* Proctor Alert Banner */}
        {proctoring.showProctorAlert && (
          <div
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1.5px solid #ef4444',
              color: '#fca5a5',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{proctoring.proctorAlertMsg || '⚠️ Focus warning detected.'}</span>
            </div>
            {!proctoring.isFullscreenActive && (
              <button
                type="button"
                onClick={() => {
                  if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
                    document.documentElement
                      .requestFullscreen()
                      .then(() => {
                        proctoring.setIsFullscreenActive(true);
                        proctoring.setShowProctorAlert(false);
                      })
                      .catch(() => {});
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Maximize2 size={12} /> Enter Fullscreen
              </button>
            )}
          </div>
        )}

        {/* Stage Switcher */}
        <RoomStageSwitcher
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={roomData.isMobile}
          messagesCount={chat.messages.length}
          stageState={stageState}
        />

        {/* Main Stage Grid */}
        <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>
          <RoomLeftStage
            activeTab={activeTab}
            stageState={stageState}
            isMobile={roomData.isMobile}
            scratchpad={{ sharedNotes, setSharedNotes, scratchpadView, setScratchpadView, isScratchpadSaved, setIsScratchpadSaved }}
            pomodoro={{ timerMode, setTimerMode, isTimerExpanded, setIsTimerExpanded, pomodoroDurationMinutes, setPomodoroDurationMinutes, pomodoroSeconds, setPomodoroSeconds, pomodoroRunning, setPomodoroRunning, pomodoroPhase, setPomodoroPhase, focusSoundEnabled, setFocusSoundEnabled, customFocusInput, setCustomFocusInput, showCustomFocusInput, setShowCustomFocusInput }}
            audio={{ activeSound, soundPlaying, showAudioPopover, setShowAudioPopover, handleSelectSound }}
            roomData={roomData}
            challengeConfig={challengeConfig}
            gameplay={gameplay}
            setIsFullscreenActive={proctoring.setIsFullscreenActive}
            handleDownloadResultImage={handleDownloadResultImage}
          />

          <RoomChatRail
            isMobile={roomData.isMobile}
            activeTab={activeTab}
            isChatCollapsed={isChatCollapsed}
            chat={chat}
            gameplay={gameplay}
            challengeConfig={challengeConfig}
            roomData={roomData}
            proctoring={proctoring}
            pomodoro={{ pomodoroRunning, pomodoroPhase }}
          />
        </div>

        {/* All Modals Aggregator */}
        <RoomAllModals
          challengeConfig={challengeConfig}
          upload={upload}
          roomData={roomData}
          proctoring={proctoring}
          gameplay={gameplay}
          goalModal={{ showGoalModal, setShowGoalModal, goalInput, setGoalInput, handleSaveGoal }}
          closeConfirm={{ showCloseConfirmModal: roomData.showCloseConfirmModal, setShowCloseConfirmModal: roomData.setShowCloseConfirmModal, handleCloseRoom: roomData.handleCloseRoom }}
          showPeersModal={showPeersModal}
          setShowPeersModal={setShowPeersModal}
          handleDownloadResultImage={handleDownloadResultImage}
        />
      </div>
    </RoomKnockLoader>
  );
}
