'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { registerMediaStream, registerAudioContext, stopAllHardwareMedia } from '@/lib/hardwareMedia';

export function useInterviewHardware({
  toastRef,
  isAiSpeakingRef,
  lastAiSpeechEndedAtRef
}) {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedAudioChunksRef = useRef([]);
  const untranscribedChunksRef = useRef([]);
  const lastVoiceTimestampRef = useRef(0);
  const hasNewAudioDataRef = useRef(false);
  const isHardwareCleanedUpRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Bulletproof Media Stream & Hardware Release
  const releaseAllMedia = useCallback(() => {
    isHardwareCleanedUpRef.current = true;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject && videoRef.current.srcObject.getTracks) {
        try {
          videoRef.current.srcObject.getTracks().forEach((track) => {
            try {
              track.stop();
              track.enabled = false;
            } catch {}
          });
        } catch {}
      }
      videoRef.current.srcObject = null;
      try { videoRef.current.pause(); } catch {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }
    stopAllHardwareMedia();
    setCameraActive(false);
    setAudioLevel(0);
  }, [isHardwareCleanedUpRef]);

  useEffect(() => {
    const onHardwareStopped = () => {
      isHardwareCleanedUpRef.current = true;
      setCameraActive(false);
      setAudioLevel(0);
    };
    window.addEventListener('hardware-media-stopped', onHardwareStopped);
    return () => window.removeEventListener('hardware-media-stopped', onHardwareStopped);
  }, [isHardwareCleanedUpRef]);

  useEffect(() => {
    const handleUnload = () => {
      releaseAllMedia();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      releaseAllMedia();
    };
  }, [releaseAllMedia]);

  // Robust Camera & Microphone Acquisition
  const startCameraAndMic = useCallback(async () => {
    try {
      isHardwareCleanedUpRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
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

      if (isHardwareCleanedUpRef.current) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
        return;
      }

      mediaStreamRef.current = stream;
      registerMediaStream(stream);

      const videoTrack = stream.getVideoTracks()?.[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn('Video track stopped by hardware or browser permissions.');
          setCameraActive(false);
        };
      }

      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks);
        registerMediaStream(audioStream);

        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioCtx;
          registerAudioContext(audioCtx);
          const source = audioCtx.createMediaStreamSource(audioStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let lastLevel = -1;
          let lastRenderTime = 0;
          const updateAudioMeter = () => {
            if (!mediaStreamRef.current || isHardwareCleanedUpRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const currentLvl = Math.min(100, Math.round(avg * 1.8));

            if (currentLvl > 16 && !isAiSpeakingRef.current && (Date.now() - lastAiSpeechEndedAtRef.current > 400)) {
              hasNewAudioDataRef.current = true;
              lastVoiceTimestampRef.current = Date.now();
            }

            const now = Date.now();
            if (now - lastRenderTime > 80 && Math.abs(currentLvl - lastLevel) >= 3) {
              lastRenderTime = now;
              lastLevel = currentLvl;
              setAudioLevel(currentLvl);
            }

            requestAnimationFrame(updateAudioMeter);
          };
          updateAudioMeter();
        } catch (audioErr) {
          console.warn('AudioContext visualization setup error:', audioErr);
        }

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
              if (isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndedAtRef.current < 600)) {
                return;
              }
              recordedAudioChunksRef.current.push(e.data);
              untranscribedChunksRef.current.push(e.data);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(1000);
        } catch (recErr) {
          console.warn('MediaRecorder init error:', recErr);
        }
      }
    } catch (err) {
      console.warn('Camera/Mic access error:', err);
      setCameraActive(false);
      toastRef.current?.error('Could not access Camera/Microphone. Ensure hardware permissions are granted.');
    }
  }, [isAiSpeakingRef, lastAiSpeechEndedAtRef, toastRef]);

  // Attach stream to video whenever videoRef mounts
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      node.muted = true;
      node.defaultMuted = true;
      node.srcObject = mediaStreamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // Transcribe recorded audio chunks via Groq Whisper API
  const transcribeAudioViaWhisper = useCallback(async () => {
    if (recordedAudioChunksRef.current.length === 0) return '';

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
    }
    return '';
  }, []);

  return {
    videoRef,
    setVideoRef,
    mediaStreamRef,
    cameraActive,
    setCameraActive,
    audioLevel,
    recordedAudioChunksRef,
    untranscribedChunksRef,
    lastVoiceTimestampRef,
    hasNewAudioDataRef,
    startCameraAndMic,
    releaseAllMedia,
    transcribeAudioViaWhisper
  };
}
