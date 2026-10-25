// Global Hardware Media Stream & Speech Watchdog
// Guarantees all camera, microphone hardware tracks, speech recognition, and audio contexts are shut down cleanly

export function registerMediaStream(stream) {
  if (typeof window === 'undefined' || !stream) return;
  window.__activeMediaStreams = window.__activeMediaStreams || [];
  if (!window.__activeMediaStreams.includes(stream)) {
    window.__activeMediaStreams.push(stream);
  }
}

export function registerSpeechRecognition(recognition) {
  if (typeof window === 'undefined' || !recognition) return;
  window.__activeSpeechRecognitions = window.__activeSpeechRecognitions || [];
  if (!window.__activeSpeechRecognitions.includes(recognition)) {
    window.__activeSpeechRecognitions.push(recognition);
  }
}

export function registerAudioContext(audioCtx) {
  if (typeof window === 'undefined' || !audioCtx) return;
  window.__activeAudioContexts = window.__activeAudioContexts || [];
  if (!window.__activeAudioContexts.includes(audioCtx)) {
    window.__activeAudioContexts.push(audioCtx);
  }
}

export function stopAllSpeechRecognition() {
  if (typeof window === 'undefined') return;
  try {
    if (window.__activeSpeechRecognitions && Array.isArray(window.__activeSpeechRecognitions)) {
      window.__activeSpeechRecognitions.forEach((recognition) => {
        try {
          if (recognition) {
            recognition.onend = null;
            recognition.onerror = null;
            recognition.onresult = null;
            recognition.onstart = null;
            if (typeof recognition.abort === 'function') {
              recognition.abort();
            } else if (typeof recognition.stop === 'function') {
              recognition.stop();
            }
          }
        } catch (e) {}
      });
      window.__activeSpeechRecognitions = [];
    }
  } catch (e) {
    console.warn('stopAllSpeechRecognition error:', e);
  }
}

export function stopAllHardwareMedia() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Immediately abort all active SpeechRecognition sessions (releases Chrome native microphone)
    stopAllSpeechRecognition();

    // 2. Cancel any pending or speaking TTS speech synthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // 3. Close all registered AudioContext instances
    if (window.__activeAudioContexts && Array.isArray(window.__activeAudioContexts)) {
      window.__activeAudioContexts.forEach((ctx) => {
        try {
          if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        } catch (e) {}
      });
      window.__activeAudioContexts = [];
    }

    // 4. Force-stop and disable every track in every registered MediaStream
    if (window.__activeMediaStreams && Array.isArray(window.__activeMediaStreams)) {
      window.__activeMediaStreams.forEach((stream) => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
        }
      });
      window.__activeMediaStreams = [];
    }

    // 5. Scan all document video and audio elements and disconnect/stop srcObject
    if (typeof document !== 'undefined') {
      const mediaEls = document.querySelectorAll('video, audio');
      mediaEls.forEach((el) => {
        try {
          if (el.srcObject && el.srcObject.getTracks) {
            el.srcObject.getTracks().forEach((track) => {
              try {
                track.stop();
                track.enabled = false;
              } catch (e) {}
            });
            el.srcObject = null;
          }
          el.pause();
        } catch (e) {}
      });
    }

    // 6. Dispatch global event so active hooks can freeze restart timers
    window.dispatchEvent(new CustomEvent('hardware-media-stopped'));
  } catch (e) {
    console.warn('stopAllHardwareMedia error:', e);
  }
}

