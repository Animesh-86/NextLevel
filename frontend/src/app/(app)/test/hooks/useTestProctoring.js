'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTestProctoring({
  mode,
  phase,
  submitting,
  handleSubmit,
  toast,
  onExitSession
}) {
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => (typeof document !== 'undefined' ? !!document.fullscreenElement : false));
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const lastInfractionTimeRef = useRef(0);

  const exitFullscreen = useCallback(() => {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => exitFullscreen();
  }, [exitFullscreen]);

  const handleInfraction = useCallback((reason) => {
    if (mode !== 'simulation' || phase !== 'testing' || submitting) return;
    const now = Date.now();
    if (now - lastInfractionTimeRef.current < 3000) return;
    lastInfractionTimeRef.current = now;

    setProctorWarnings((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        toast.error(`🚫 Exam Auto-Submitted: 3 proctoring infractions reached (${reason}).`);
        handleSubmit();
        return 3;
      } else if (next === 2) {
        toast.warning(`⚠️ FINAL PROCTOR WARNING (2 of 3): ${reason}! Next infraction will automatically submit your exam.`);
      } else {
        toast.warning(`⚠️ Proctor Warning (1 of 3): ${reason}! Please remain focused on the exam.`);
      }
      return next;
    });
  }, [mode, phase, submitting, handleSubmit, toast]);

  // Monitor Tab Switch & Application Blur in Simulation Mode
  useEffect(() => {
    if (mode !== 'simulation' || phase !== 'testing' || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInfraction('Switched browser tab or minimized window');
      }
    };
    const handleBlur = () => {
      handleInfraction('Window blur / switched application');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [mode, phase, submitting, handleInfraction]);

  // Monitor Full-Screen changes & Escape key
  useEffect(() => {
    if ((phase !== 'testing' && phase !== 'review') || submitting) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!(typeof document !== 'undefined' && document.fullscreenElement);
      setIsFullscreen(isCurrentlyFull);
      if (!isCurrentlyFull && (phase === 'testing' || phase === 'review') && !submitting) {
        setShowExitModal(true);
        if (mode === 'simulation') {
          handleInfraction('Exited full-screen exam mode');
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitModal(true);
        if (mode === 'simulation') {
          handleInfraction('Pressed Escape / Exited full-screen exam');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, submitting, mode, handleInfraction]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
    setTimeout(() => {
      const testElem = document.getElementById('test-container');
      if (testElem && testElem.requestFullscreen) {
        testElem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    }, 100);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    exitFullscreen();
    setIsFullscreen(false);
    setProctorWarnings(0);
    lastInfractionTimeRef.current = 0;
    if (onExitSession) onExitSession();
    toast.info('Exam session exited.');
  }, [exitFullscreen, onExitSession, toast]);

  const resetProctorWarnings = useCallback(() => {
    setProctorWarnings(0);
    lastInfractionTimeRef.current = 0;
    setShowExitModal(false);
  }, []);

  return {
    showExitModal,
    setShowExitModal,
    isFullscreen,
    setIsFullscreen,
    proctorWarnings,
    exitFullscreen,
    handleInfraction,
    handleCancelExit,
    handleConfirmExit,
    resetProctorWarnings
  };
}
