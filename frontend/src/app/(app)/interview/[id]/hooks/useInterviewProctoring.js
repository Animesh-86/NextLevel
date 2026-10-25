'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Play subtle warning audio chime using Web Audio API
export function playAlertChime() {
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
  } catch {
    // AudioContext blocked or not supported
  }
}

export function useInterviewProctoring({
  session,
  finishing,
  cameraActive,
  videoRef,
  mediaStreamRef,
  toast,
  onDisqualify,
  setShowExitConfirmModal,
  setIsFullscreen
}) {
  const canvasRef = useRef(null);
  const [candidateInFrame, setCandidateInFrame] = useState(true);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const proctorWarningsRef = useRef(0);
  const outOfFrameCountRef = useRef(0);
  const lastInfractionTimestampRef = useRef(0);
  const prevFrameLuminanceRef = useRef(null);
  const missedFramesRef = useRef(0);

  // Handle Proctoring Infraction (3 Warnings Rule)
  const handleInfraction = useCallback((description) => {
    const now = Date.now();
    if (now - lastInfractionTimestampRef.current < 3000) return;
    lastInfractionTimestampRef.current = now;

    playAlertChime();

    const next = Math.min(3, proctorWarningsRef.current + 1);
    proctorWarningsRef.current = next;
    setProctorWarnings(next);

    if (next >= 3) {
      toast.error(`🚫 Disqualified: 3 proctoring infractions reached (${description}). Finalizing session...`);
      onDisqualify(`Session terminated: 3 infractions (${description})`);
    } else if (next === 2) {
      toast.warning(`⚠️ FINAL WARNING (2 of 3): ${description}! Next violation will automatically conclude your interview.`);
    } else {
      toast.warning(`⚠️ Proctor Warning (1 of 3): ${description}! Please stay focused on the interview.`);
    }
  }, [onDisqualify, toast]);

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
  }, [setIsFullscreen]);

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
        handleInfraction('Exited full-screen proctored session');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitConfirmModal(true);
        if (session && session.status !== 'COMPLETED' && !finishing) {
          handleInfraction('Attempted Escape / Exited proctoring full-screen');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [session, finishing, setIsFullscreen, setShowExitConfirmModal, handleInfraction]);

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

  // Frame Presence & Proctoring Detection Loop (Robust Multi-Signal Subject Presence)
  useEffect(() => {
    if (!cameraActive) {
      prevFrameLuminanceRef.current = null;
      missedFramesRef.current = 0;
      return;
    }

    missedFramesRef.current = 0;
    outOfFrameCountRef.current = 0;

    const frameInterval = setInterval(async () => {
      if (!session || session.status === 'COMPLETED' || finishing) return;
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) return;

      // Keep video playing in background if browser suspended playback
      if (video.paused) {
        video.play().catch(() => {});
      }

      // Verify active hardware video track
      const videoTrack = mediaStreamRef.current?.getVideoTracks()?.[0];
      if (!videoTrack || videoTrack.readyState !== 'live' || videoTrack.muted) {
        missedFramesRef.current += 1;
        if (missedFramesRef.current >= 3) {
          setCandidateInFrame(false);
          outOfFrameCountRef.current += 1;
          if (outOfFrameCountRef.current >= 8) {
            outOfFrameCountRef.current = 0;
            missedFramesRef.current = 3;
            handleInfraction('Video camera feed stopped or muted');
          }
        }
        return;
      }

      // 1. Try native browser FaceDetector API if available
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          if (faces && faces.length > 0) {
            setCandidateInFrame(true);
            missedFramesRef.current = 0;
            outOfFrameCountRef.current = 0;
            return;
          }
        } catch {}
      }

      // 2. Advanced Multi-Signal Computer Vision Detection:
      // Combines:
      // a) Inclusive Multi-Gamut Skin Chrominance (Fitzpatrick I-VI, resilient to cool LED / screen glow)
      // b) Temporal Frame-to-Frame Motion Differencing (breathing, speaking, head gestures)
      // c) Spatial Luminance Variance (differentiates human face/hair/clothing geometry from blank/covered sensors)
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, 80, 60);
        const frame = ctx.getImageData(0, 0, 80, 60);
        const data = frame.data;

        let totalLuminance = 0;
        let totalSampled = 0;
        let skinPixels = 0;
        let motionPixels = 0;

        const currentLuminance = new Uint8Array(80 * 60);
        const prevLuminance = prevFrameLuminanceRef.current;

        // Broad scan zone across candidate area (excluding small 5% border)
        for (let y = 3; y < 57; y++) {
          for (let x = 4; x < 76; x++) {
            const idx = (y * 80 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Standard ITU-R BT.601 Luminance
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
            currentLuminance[y * 80 + x] = lum;
            totalLuminance += lum;
            totalSampled++;

            // Temporal Motion Differencing against previous frame
            if (prevLuminance) {
              const diff = Math.abs(lum - prevLuminance[y * 80 + x]);
              if (diff > 8) {
                motionPixels++;
              }
            }

            // Inclusive Skin Chrominance across all skin types:
            // 1. Wide-Gamut YCbCr
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            const isYCbCrSkin = (
              cb >= 65 && cb <= 140 &&
              cr >= 120 && cr <= 185 &&
              r > 26 && g > 16 && b > 10 &&
              r >= g * 0.70 // Tolerant to cool LED monitors and webcam white balance
            );

            // 2. Normalized RGB Gamut (invariant to overall brightness)
            const rgbSum = r + g + b;
            const isNormRgbSkin = rgbSum > 45 && (
              (r / rgbSum > 0.31) && (r / rgbSum < 0.65) &&
              (g / rgbSum > 0.20) && (g / rgbSum < 0.45) &&
              (r - b > -20)
            );

            if (isYCbCrSkin || isNormRgbSkin) {
              skinPixels++;
            }
          }
        }

        prevFrameLuminanceRef.current = currentLuminance;

        const avgLuminance = totalLuminance / (totalSampled || 1);
        const skinRatio = skinPixels / (totalSampled || 1);
        const motionRatio = prevLuminance ? (motionPixels / (totalSampled || 1)) : 0;

        // Contrast variance across sampled grid (human features create rich gradients)
        let sumSqDiff = 0;
        let varianceSamples = 0;
        for (let y = 3; y < 57; y += 2) {
          for (let x = 4; x < 76; x += 2) {
            const lum = currentLuminance[y * 80 + x];
            const diff = lum - avgLuminance;
            sumSqDiff += diff * diff;
            varianceSamples++;
          }
        }
        const variance = sumSqDiff / (varianceSamples || 1);
        const stdDev = Math.sqrt(variance);

        // Disqualify if camera is taped, pitch black, or washed out flat white
        const isCameraCoveredOrDark = avgLuminance < 10;
        const isCameraBlownOut = avgLuminance > 248 && stdDev < 8;

        // Presence is confirmed if camera is displaying a live scene with:
        // A) Detected skin chrominance (>= 1.0% of frame)
        // B) OR physical motion from a live subject (>= 0.8% pixel delta between checks)
        // C) OR clear subject geometry/contrast (stdDev >= 13 with normal exposure)
        const isSubjectPresent = !isCameraCoveredOrDark && !isCameraBlownOut && (
          skinRatio >= 0.010 ||
          (prevLuminance && motionRatio >= 0.008) ||
          (stdDev >= 13 && avgLuminance >= 18 && avgLuminance <= 235)
        );

        if (isSubjectPresent) {
          missedFramesRef.current = 0;
          outOfFrameCountRef.current = 0;
          setCandidateInFrame(true);
        } else {
          missedFramesRef.current += 1;
          // Smooth debounce: require 3 consecutive failed checks (~3.6s) before showing missing
          if (missedFramesRef.current >= 3) {
            setCandidateInFrame(false);
            outOfFrameCountRef.current += 1;

            // Only trigger infraction warning after sustained continuous absence (~10 seconds)
            if (outOfFrameCountRef.current >= 8) {
              outOfFrameCountRef.current = 0;
              missedFramesRef.current = 3;
              handleInfraction('Candidate out of camera frame');
            }
          }
        }
      } catch (err) {
        console.warn('Frame presence analysis error:', err);
      }
    }, 1200);

    return () => {
      clearInterval(frameInterval);
      prevFrameLuminanceRef.current = null;
    };
  }, [cameraActive, handleInfraction, mediaStreamRef, videoRef, session, finishing]);

  return {
    canvasRef,
    candidateInFrame,
    setCandidateInFrame,
    proctorWarnings,
    handleInfraction,
    requestFullScreenMode
  };
}
