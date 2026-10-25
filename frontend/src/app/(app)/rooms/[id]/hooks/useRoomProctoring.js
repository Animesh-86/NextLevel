'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

export function useRoomProctoring({ stageState, setStageState, roomIdOrCode, currentUserName }) {
  const toast = useToast();
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const proctorWarningsRef = useRef(0);
  const lastInfractionTimeRef = useRef(0);

  const [rawShowProctorAlert, setShowProctorAlert] = useState(false);
  const [proctorAlertMsg, setProctorAlertMsg] = useState('');
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [disqualifiedReason, setDisqualifiedReason] = useState(null);

  const isProctoredActive = (stageState === 'live_question' || stageState === 'checkpoint') && !disqualifiedReason;
  const showProctorAlert = isProctoredActive && rawShowProctorAlert;
  const setIsProctoredActive = () => {};

  useEffect(() => {
    if (stageState !== 'live_question' && stageState !== 'checkpoint') {
      return;
    }

    const triggerDisqualification = (reason) => {
      setDisqualifiedReason(reason);
      setShowProctorAlert(false);
      proctorWarningsRef.current = 3;
      setProctorWarnings(3);

      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }

      apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚫 ${currentUserName || 'A participant'} was disqualified from the challenge for proctor infractions (3/3).`,
          type: 'SYSTEM'
        })
      }).catch(() => {});

      setStageState('idle');
      toast.error('🚫 Disqualified: Exceeded maximum allowed infractions (3/3).');
    };

    const recordInfraction = (reason, alertMsg) => {
      const now = Date.now();
      if (now - lastInfractionTimeRef.current < 5000) return;
      lastInfractionTimeRef.current = now;

      const nextWarnings = Math.min(3, proctorWarningsRef.current + 1);
      proctorWarningsRef.current = nextWarnings;
      setProctorWarnings(nextWarnings);

      if (nextWarnings >= 3) {
        triggerDisqualification(`${reason} (3/3 infractions).`);
      } else {
        setProctorAlertMsg(`${alertMsg} (${nextWarnings}/3)`);
        setShowProctorAlert(true);
        toast.warning(`⚠️ Proctor Warning (${nextWarnings}/3): ${reason}. (3 infractions will result in disqualification).`);
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        recordInfraction('Tab switch detected', '⚠️ Tab switch detected!');
      }
    };

    const handleWindowBlur = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        recordInfraction('Focus lost from challenge window', '⚠️ Challenge window lost focus!');
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreenActive(isFull);
      if (!isFull && (stageState === 'live_question' || stageState === 'checkpoint')) {
        setProctorAlertMsg('⚠️ Exited full screen! Click to restore proctored full screen.');
        setShowProctorAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [stageState, roomIdOrCode, currentUserName, setStageState, toast]);

  const resetProctoring = () => {
    proctorWarningsRef.current = 0;
    lastInfractionTimeRef.current = 0;
    setProctorWarnings(0);
    setShowProctorAlert(false);
    setDisqualifiedReason(null);
  };

  return {
    isProctoredActive,
    setIsProctoredActive,
    proctorWarnings,
    setProctorWarnings,
    proctorWarningsRef,
    lastInfractionTimeRef,
    showProctorAlert,
    setShowProctorAlert,
    proctorAlertMsg,
    setProctorAlertMsg,
    isFullscreenActive,
    setIsFullscreenActive,
    disqualifiedReason,
    setDisqualifiedReason,
    resetProctoring
  };
}
