'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

export function useRoomChallengeConfig({
  roomIdOrCode,
  room,
  setRoom,
  selectedExamIds,
  selectedExamId,
  customTitle,
  stageState,
  setStageState,
  fetchRoomData,
  fetchMessages,
  handleStartChallenge,
  resetGameplay
}) {
  const toast = useToast();
  const [gameMode, setGameMode] = useState('STANDARD');
  const [challengeQCount, setChallengeQCount] = useState(10);
  const [isCustomQCount, setIsCustomQCount] = useState(false);
  const [customQCountInput, setCustomQCountInput] = useState('10');
  const [challengePacing, setChallengePacing] = useState(30);
  const [isCustomPacing, setIsCustomPacing] = useState(false);
  const [customPacingInput, setCustomPacingInput] = useState('30');
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [challengeStartMode, setChallengeStartMode] = useState('instant');
  const [bossHpSetting, setBossHpSetting] = useState(1000);
  const [teamDraftSetting, setTeamDraftSetting] = useState('auto');
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showGameInfoModal, setShowGameInfoModal] = useState(false);
  const [viewingPastChallenge, setViewingPastChallenge] = useState(null);

  const titleInputRef = useRef(null);
  const [lobbyCountdown, setLobbyCountdown] = useState(null);
  const autoStartTriggeredRef = useRef(null);

  // 30s Lobby Live Countdown
  useEffect(() => {
    if (stageState !== 'invite_open' || !room?.activeChallenge) return;

    const ch = room.activeChallenge;
    const computeRemaining = () => {
      if (ch.lobbyEndsAt) {
        const diff = Math.ceil((new Date(ch.lobbyEndsAt).getTime() - Date.now()) / 1000);
        return Math.max(0, diff);
      }
      if (ch.createdAt) {
        const targetSec = ch.lobbySeconds || 30;
        const diff = Math.ceil((new Date(ch.createdAt).getTime() + (targetSec * 1000) - Date.now()) / 1000);
        return Math.max(0, diff);
      }
      return 30;
    };

    const initialRem = computeRemaining();
    setLobbyCountdown(initialRem);

    if (initialRem <= 0) {
      if (autoStartTriggeredRef.current !== ch.id) {
        autoStartTriggeredRef.current = ch.id;
        handleStartChallenge(ch);
      }
      return;
    }

    const interval = setInterval(() => {
      const rem = computeRemaining();
      setLobbyCountdown(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (autoStartTriggeredRef.current !== ch.id) {
          autoStartTriggeredRef.current = ch.id;
          toast.info('🚀 30s lobby complete! Sprint auto-starting now...');
          handleStartChallenge(ch);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stageState, room?.activeChallenge, handleStartChallenge, toast]);

  // Create Challenge
  const handleCreateChallenge = async (e) => {
    if (e) e.preventDefault();
    if (!customTitle.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }

    const effectiveQCount = isCustomQCount
      ? Math.max(1, Math.min(100, parseInt(customQCountInput, 10) || 10))
      : challengeQCount;

    const effectivePacing = isCustomPacing
      ? Math.max(5, Math.min(300, parseInt(customPacingInput, 10) || 30))
      : challengePacing;

    const chosenExamIds = (selectedExamIds && selectedExamIds.length > 0)
      ? selectedExamIds
      : (selectedExamId ? [selectedExamId] : []);

    setCreatingChallenge(true);
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle.trim(),
          examId: chosenExamIds[0] || '',
          examIds: chosenExamIds,
          questionCount: effectiveQCount,
          perQuestionSeconds: effectivePacing,
          negativeMarking: (gameMode === 'SURVIVAL' || gameMode === 'BOSS') ? false : negativeMarking,
          gameMode,
          bossMaxHp: bossHpSetting,
          teamDraft: teamDraftSetting,
          lobbySeconds: challengeStartMode === 'lobby' ? 30 : 0,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        setShowCreateChallengeModal(false);
        if (challengeStartMode === 'instant') {
          toast.success(`Challenge "${json.data.activeChallenge?.title}" launched immediately!`);
          handleStartChallenge(json.data.activeChallenge);
        } else {
          setStageState('invite_open');
          setLobbyCountdown(30);
          autoStartTriggeredRef.current = null;
          toast.success(`Challenge lobby for "${json.data.activeChallenge?.title}" opened! Auto-starts in 30 seconds.`);
        }
        fetchMessages();
      } else {
        toast.error(json.message || 'Failed to create challenge');
      }
    } catch (err) {
      toast.error('Failed to create challenge');
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleCancelChallenge = async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    setLobbyCountdown(null);
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/challenge?reason=cancelled`, { method: 'DELETE' });
    } catch (e) {}
    resetGameplay();
    setStageState('idle');
    fetchRoomData();
    fetchMessages();
  };

  const handleBackToMainRoom = async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    setLobbyCountdown(null);
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/challenge`, { method: 'DELETE' });
    } catch (e) {}
    resetGameplay();
    setStageState('idle');
    fetchRoomData();
    fetchMessages();
  };

  return {
    gameMode,
    setGameMode,
    challengeQCount,
    setChallengeQCount,
    isCustomQCount,
    setIsCustomQCount,
    customQCountInput,
    setCustomQCountInput,
    challengePacing,
    setChallengePacing,
    isCustomPacing,
    setIsCustomPacing,
    customPacingInput,
    setCustomPacingInput,
    negativeMarking,
    setNegativeMarking,
    challengeStartMode,
    setChallengeStartMode,
    bossHpSetting,
    setBossHpSetting,
    teamDraftSetting,
    setTeamDraftSetting,
    creatingChallenge,
    showCreateChallengeModal,
    setShowCreateChallengeModal,
    showGameInfoModal,
    setShowGameInfoModal,
    viewingPastChallenge,
    setViewingPastChallenge,
    titleInputRef,
    lobbyCountdown,
    setLobbyCountdown,
    handleCreateChallenge,
    handleCancelChallenge,
    handleBackToMainRoom
  };
}
