/**
 * Zero-dependency procedural Web Audio API Ambient Sound Generator
 * Generates brown noise, rain ambiance, cafe murmur, and lo-fi warm tones on the fly.
 */

let audioCtx = null;
let activeSource = null;
let gainNode = null;

export function isAudioRunning() {
  return audioCtx && audioCtx.state === 'running' && activeSource !== null;
}

export function stopAmbientSound() {
  try {
    if (gainNode && audioCtx) {
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        if (activeSource) {
          try { activeSource.stop(); } catch (e) {}
          try { activeSource.disconnect(); } catch (e) {}
          activeSource = null;
        }
      }, 350);
    }
  } catch (e) {
    console.error('Failed to stop ambient sound:', e);
  }
}

export function playAmbientSound(type, volume = 0.15) {
  stopAmbientSound();
  if (!type || type === 'none') return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.5);
    gainNode.connect(audioCtx.destination);

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === 'brown_noise' || type === 'lofi') {
      // Brown noise algorithm
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = type === 'lofi' ? 'lowpass' : 'lowpass';
      filter.frequency.value = type === 'lofi' ? 450 : 350;

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      whiteNoise.start();
      activeSource = whiteNoise;

    } else if (type === 'rain') {
      // Rain: Pink/Brown noise with bandpass filtering
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const rainSource = audioCtx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      rainSource.connect(filter);
      filter.connect(gainNode);
      rainSource.start();
      activeSource = rainSource;

    } else if (type === 'cafe') {
      // Cafe: Warm drone with gentle dual bandpass
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const cafeSource = audioCtx.createBufferSource();
      cafeSource.buffer = noiseBuffer;
      cafeSource.loop = true;

      const filter1 = audioCtx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.value = 500;
      filter1.Q.value = 0.8;

      cafeSource.connect(filter1);
      filter1.connect(gainNode);
      cafeSource.start();
      activeSource = cafeSource;
    }
  } catch (err) {
    console.error('Error starting ambient sound:', err);
  }
}
