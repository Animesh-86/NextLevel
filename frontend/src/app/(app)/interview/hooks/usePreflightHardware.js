'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { registerMediaStream, stopAllHardwareMedia } from '@/lib/hardwareMedia';
import { useToast } from '@/components/Toast';

export function usePreflightHardware({ selectedRoleId, customJD }) {
  const toast = useToast();
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [camPermissionGranted, setCamPermissionGranted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [faceDetectedInFrame, setFaceDetectedInFrame] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);

  const preflightVideoRef = useRef(null);
  const preflightCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const preflightStreamRef = useRef(null);

  const setPreflightVideoRef = useCallback((node) => {
    preflightVideoRef.current = node;
    if (node && preflightStreamRef.current) {
      if (node.srcObject !== preflightStreamRef.current) {
        node.srcObject = preflightStreamRef.current;
        node.play().catch(() => {});
      }
    }
  }, []);

  const stopPreflightStreams = useCallback(() => {
    stopAllHardwareMedia();
    if (preflightStreamRef.current) {
      preflightStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
          t.enabled = false;
        } catch {}
      });
      preflightStreamRef.current = null;
    }
    if (preflightVideoRef.current) {
      if (preflightVideoRef.current.srcObject && preflightVideoRef.current.srcObject.getTracks) {
        try {
          preflightVideoRef.current.srcObject.getTracks().forEach(t => {
            try { t.stop(); t.enabled = false; } catch {}
          });
        } catch {}
      }
      preflightVideoRef.current.srcObject = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setCamPermissionGranted(false);
    setMicPermissionGranted(false);
    setFaceDetectedInFrame(false);
    setMicAudioLevel(0);
  }, []);

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

  // Ensure stream is attached to video whenever preflight modal becomes visible
  useEffect(() => {
    if (showPreflightModal && preflightVideoRef.current && preflightStreamRef.current) {
      if (preflightVideoRef.current.srcObject !== preflightStreamRef.current) {
        preflightVideoRef.current.srcObject = preflightStreamRef.current;
        preflightVideoRef.current.play().catch(() => {});
      }
    }
  }, [showPreflightModal]);

  const acquireHardwareStreams = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCamPermissionGranted(false);
      setMicPermissionGranted(false);
      return;
    }

    try {
      let stream = null;

      // 1. Try requesting camera and mic simultaneously
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
        setCamPermissionGranted(true);
        setMicPermissionGranted(true);
      } catch (jointErr) {
        console.warn('Simultaneous camera+mic request failed, falling back to split requests:', jointErr);

        // Try mic separately
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream = audioStream;
          setMicPermissionGranted(true);
        } catch {
          setMicPermissionGranted(false);
        }

        // Try video separately
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
          });
          if (stream) {
            videoStream.getVideoTracks().forEach(t => stream.addTrack(t));
          } else {
            stream = videoStream;
          }
          setCamPermissionGranted(true);
        } catch {
          setCamPermissionGranted(false);
        }
      }

      if (!stream) {
        console.warn('Neither camera nor mic stream could be acquired');
        return;
      }

      preflightStreamRef.current = stream;
      registerMediaStream(stream);

      if (preflightVideoRef.current && stream.getVideoTracks().length > 0) {
        preflightVideoRef.current.srcObject = stream;
        preflightVideoRef.current.play().catch(() => {});
      }

      // Setup audio level meter
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        try {
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
        } catch (audioCtxErr) {
          console.warn('AudioContext error in preflight:', audioCtxErr);
        }
      }

      // If video track is active, mark face detected after 1 second as baseline
      if (stream.getVideoTracks().length > 0) {
        setTimeout(() => {
          setFaceDetectedInFrame(true);
        }, 1000);
      }
    } catch (err) {
      console.warn('Preflight hardware error:', err);
    }
  }, []);

  const openPreflightCheck = async () => {
    if (selectedRoleId === 'custom-jd' && !customJD?.trim()) {
      toast.error('Please enter a target job description or role details.');
      return;
    }

    setShowPreflightModal(true);
    await acquireHardwareStreams();
  };

  // Face Detection / Frame Presence Loop
  useEffect(() => {
    if (!showPreflightModal || !camPermissionGranted) return;

    let prevPreflightLuminance = null;
    const interval = setInterval(async () => {
      const video = preflightVideoRef.current;
      const canvas = preflightCanvasRef.current;
      if (!video) return;
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) return;

      // Keep video playing
      if (video.paused) {
        video.play().catch(() => {});
      }

      // 1. Try native browser FaceDetector API if available
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          if (faces && faces.length > 0) {
            setFaceDetectedInFrame(true);
            return;
          }
        } catch {}
      }

      // 2. Multi-Signal Computer Vision Detection
      if (canvas) {
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

          for (let y = 3; y < 57; y++) {
            for (let x = 4; x < 76; x++) {
              const idx = (y * 80 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              const lum = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
              currentLuminance[y * 80 + x] = lum;
              totalLuminance += lum;
              totalSampled++;

              if (prevPreflightLuminance) {
                const diff = Math.abs(lum - prevPreflightLuminance[y * 80 + x]);
                if (diff > 8) {
                  motionPixels++;
                }
              }

              // Inclusive YCbCr Skin Gamut
              const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

              const isYCbCrSkin = (
                cb >= 65 && cb <= 140 &&
                cr >= 120 && cr <= 185 &&
                r > 26 && g > 16 && b > 10 &&
                r >= g * 0.70
              );

              // Normalized RGB Skin Gamut
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

          prevPreflightLuminance = currentLuminance;

          const avgLuminance = totalLuminance / (totalSampled || 1);
          const skinRatio = skinPixels / (totalSampled || 1);
          const motionRatio = prevPreflightLuminance ? (motionPixels / (totalSampled || 1)) : 0;

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

          const isCovered = avgLuminance < 10 || (avgLuminance > 248 && stdDev < 8);
          const isPresent = !isCovered && (
            skinRatio >= 0.010 ||
            motionRatio >= 0.008 ||
            (stdDev >= 13 && avgLuminance >= 18 && avgLuminance <= 235)
          );

          setFaceDetectedInFrame(isPresent);
        } catch {}
      }
    }, 600);

    return () => clearInterval(interval);
  }, [showPreflightModal, camPermissionGranted]);

  return {
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
  };
}
