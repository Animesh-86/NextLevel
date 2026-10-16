// Global Hardware Media Stream Manager
// Guarantees all camera and microphone hardware tracks are shut down cleanly across all pages

export function registerMediaStream(stream) {
  if (typeof window === 'undefined' || !stream) return;
  window.__activeMediaStreams = window.__activeMediaStreams || [];
  if (!window.__activeMediaStreams.includes(stream)) {
    window.__activeMediaStreams.push(stream);
  }
}

export function stopAllHardwareMedia() {
  if (typeof window === 'undefined') return;
  try {
    if (window.__activeMediaStreams && Array.isArray(window.__activeMediaStreams)) {
      window.__activeMediaStreams.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
        }
      });
      window.__activeMediaStreams = [];
    }

    // Also scan all document video and audio elements and disconnect/stop srcObject
    if (typeof document !== 'undefined') {
      const mediaEls = document.querySelectorAll('video, audio');
      mediaEls.forEach(el => {
        try {
          if (el.srcObject && el.srcObject.getTracks) {
            el.srcObject.getTracks().forEach(track => {
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
  } catch (e) {
    console.warn('stopAllHardwareMedia error:', e);
  }
}
