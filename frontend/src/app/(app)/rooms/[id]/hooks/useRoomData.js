'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { stopAmbientSound } from '@/lib/ambientSound';

export function useRoomData(arg1, arg2, arg3) {
  const toast = useToast();

  const options = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : {
    roomIdOrCode: arg1,
    router: arg2,
    ...(arg3 && typeof arg3 === 'object' ? arg3 : {})
  };

  const {
    roomIdOrCode,
    router,
    stageState,
    setStageState,
    fetchMessages
  } = options;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStep, setJoinStep] = useState('join');

  // Current User
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');

  // Hardware/Interaction States
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Expiry display
  const [expiryDisplay, setExpiryDisplay] = useState('No Expiry');
  const [isExpiryAmber, setIsExpiryAmber] = useState(false);
  const [showExpiryPopover, setShowExpiryPopover] = useState(false);

  // Peer goal state
  const [myGoal, setMyGoal] = useState('');

  // Confirmation modal for host
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await apiFetch('/api/user/profile');
        const json = await res.json();
        if (json.success && json.data) {
          const uId = json.data.id || json.data._id;
          setCurrentUserId(uId);
          setCurrentUserName(json.data.name || 'Student');
        }
      } catch (err) {}
    }
    fetchMe();
  }, []);

  // Expiry calculation (amber in last 5 minutes)
  useEffect(() => {
    if (!room || !room.expiresAt) {
      setExpiryDisplay('No Expiry');
      setIsExpiryAmber(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(room.expiresAt);
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setExpiryDisplay('Expired');
        setIsExpiryAmber(true);
        toast.info('This study room has expired and is now closed.');
        router.push('/rooms');
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        setIsExpiryAmber(totalSecs <= 300);

        if (hours > 0) {
          setExpiryDisplay(`${hours}h ${mins}m`);
        } else {
          setExpiryDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room, router, toast]);

  // Fetch room data
  const fetchRoomData = useCallback(async (isInitial = false) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}`);
      if (!res.ok) {
        if (isInitial) {
          toast.error('Study room not found or expired');
          router.push('/rooms');
        }
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        if (json.data.participants && currentUserId) {
          const me = json.data.participants.find(
            p => p.userId === currentUserId || String(p.userId) === String(currentUserId)
          );
          if (me && me.goal) {
            setMyGoal(me.goal);
          }
        }
        if (
          stageState === 'idle' &&
          typeof setStageState === 'function' &&
          json.data.activeChallenge &&
          json.data.activeChallenge.status === 'INVITING'
        ) {
          setStageState('invite_open');
        }
      } else {
        if (isInitial) {
          toast.error('Study room not found or expired');
          router?.push('/rooms');
        }
      }
    } catch (err) {
      console.error('Fetch room error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [roomIdOrCode, router, currentUserId, toast, stageState, setStageState]);

  // Join room once on mount + 15s Heartbeat + SendBeacon on pagehide
  useEffect(() => {
    let mounted = true;
    async function join() {
      try {
        setJoinStep('join');
        await apiFetch(`/api/rooms/${roomIdOrCode}/join`, { method: 'POST' });
        if (mounted) {
          setJoinStep('connect');
          await fetchRoomData(true);
          setJoinStep('sync');
          if (typeof fetchMessages === 'function') await fetchMessages();
          setJoinStep('ready');
        }
      } catch (err) {
        console.error('Join room error:', err);
        if (mounted) {
          setJoinStep('ready');
          setLoading(false);
        }
      }
    }
    join();

    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchRoomData(false);
        if (typeof fetchMessages === 'function') fetchMessages();
      }
    }, 4000);

    const heartbeatInterval = setInterval(() => {
      if (mounted) {
        apiFetch(`/api/rooms/${roomIdOrCode}/presence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        }).catch(() => {});
      }
    }, 15000);

    const handlePageHide = () => {
      navigator.sendBeacon(`/api/rooms/${roomIdOrCode}/leave`);
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('pagehide', handlePageHide);
      stopAmbientSound();
    };
  }, [roomIdOrCode, fetchRoomData, fetchMessages]);

  // Adjust room timer
  const handleAdjustRoomTimer = async (deltaMinutes) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/extend?minutes=${deltaMinutes}`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setRoom(json.data);
        const sign = deltaMinutes > 0 ? '+' : '';
        toast.success(`Room timer adjusted (${sign}${deltaMinutes}m) across all screens! ⏱️`);
      } else {
        toast.error(json.message || 'Failed to adjust room timer');
      }
    } catch (err) {
      toast.error('Failed to adjust room timer');
    }
  };

  const handleExtendRoom = () => handleAdjustRoomTimer(30);

  const toggleMic = () => {
    setIsMicMuted(prev => {
      const next = !prev;
      toast.info(next ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️');
      return next;
    });
  };

  const toggleCamera = () => {
    setIsVideoOff(prev => {
      const next = !prev;
      toast.info(next ? 'Camera turned off 🚫' : 'Camera turned on 📹');
      return next;
    });
  };

  const handleRaiseHand = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (next) {
      toast.info('✋ Hand raised!');
      try {
        await apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `✋ ${currentUserName} raised their hand!`,
            type: 'SYSTEM'
          })
        });
        if (typeof fetchMessages === 'function') fetchMessages();
      } catch (e) {}
    } else {
      toast.info('Hand lowered');
    }
  };

  const handleCloseRoom = async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Study room closed');
        router.push('/rooms');
      } else {
        toast.error(json.message || 'Failed to close room');
      }
    } catch (err) {
      toast.error('Failed to close room');
    } finally {
      setShowCloseConfirmModal(false);
    }
  };

  const handleExitRoom = async () => {
    try {
      await apiFetch(`/api/rooms/${roomIdOrCode}/leave`, { method: 'POST' });
    } catch (e) {}
    router.push('/rooms');
  };

  const handleKickUser = async (targetUserId) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/kick/${targetUserId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Participant removed from room');
        fetchRoomData();
      } else {
        toast.error(json.message || 'Failed to remove participant');
      }
    } catch (err) {
      toast.error('Failed to kick user');
    }
  };

  const handleTransferHost = async (targetUserId) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/transfer-host/${targetUserId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Host ownership transferred successfully');
        fetchRoomData();
      } else {
        toast.error(json.message || 'Failed to transfer host');
      }
    } catch (err) {
      toast.error('Failed to transfer host');
    }
  };

  return {
    room,
    setRoom,
    loading,
    joinStep,
    setJoinStep,
    currentUserId,
    currentUserName,
    isMicMuted,
    isVideoOff,
    isHandRaised,
    expiryDisplay,
    isExpiryAmber,
    showExpiryPopover,
    setShowExpiryPopover,
    myGoal,
    setMyGoal,
    showCloseConfirmModal,
    setShowCloseConfirmModal,
    isMobile,
    fetchRoomData,
    handleAdjustRoomTimer,
    handleExtendRoom,
    toggleMic,
    toggleCamera,
    handleRaiseHand,
    handleCloseRoom,
    handleExitRoom,
    handleKickUser,
    handleTransferHost
  };
}
