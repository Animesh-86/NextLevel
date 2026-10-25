'use client';

import { useEffect, useRef, useCallback } from 'react';

const createBrownNoise = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut * 0.99 + white * 0.01);
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
};

export function useFocusAudio({ isRunning, soundType, volume, isMuted }) {
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const metronomeRef = useRef(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume / 100, ctx.currentTime);
      masterGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const volVal = isMuted ? 0 : volume / 100;
      masterGainRef.current.gain.setValueAtTime(volVal, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  const stopAmbientSounds = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];

    if (metronomeRef.current) {
      metronomeRef.current.stop();
      metronomeRef.current = null;
    }
  }, []);

  const playZenBell = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0);
    bellGain.connect(ctx.destination);

    const frequencies = [220, 442, 663, 885, 1107, 1330];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const decayFactor = 1.0 - (idx * 0.12);
      overtoneGain.gain.setValueAtTime(0.12 / frequencies.length, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0 * Math.max(0.1, decayFactor));

      osc.connect(overtoneGain);
      overtoneGain.connect(bellGain);
      osc.start(now);
      osc.stop(now + 7.2);
    });
  }, []);

  const startAmbientSound = useCallback((type) => {
    initAudio();
    stopAmbientSounds();

    if (type === 'none' || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const output = masterGainRef.current;

    if (type === 'noise') {
      const source = createBrownNoise(ctx);
      source.connect(output);
      source.start();
      activeSourcesRef.current.push(source);
    } else if (type === 'rain') {
      const rumble = createBrownNoise(ctx);
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(450, ctx.currentTime);
      rumble.connect(rumbleFilter);
      rumbleFilter.connect(output);
      rumble.start();
      activeSourcesRef.current.push(rumble);

      let timerId = null;
      const playRaindrop = (context, time, out) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700 + Math.random() * 1100, time);
        filter.Q.value = 6;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.008, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015 + Math.random() * 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(out);

        osc.start(time);
        osc.stop(time + 0.05);
      };

      const scheduler = () => {
        const nextDropDelay = 0.015 + Math.random() * 0.035;
        playRaindrop(ctx, ctx.currentTime + nextDropDelay, output);
        timerId = setTimeout(scheduler, nextDropDelay * 1000);
      };

      scheduler();
      metronomeRef.current = { stop: () => clearTimeout(timerId) };
    } else if (type === 'beats') {
      const noise = createBrownNoise(ctx);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(140, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(output);
      noise.start();
      activeSourcesRef.current.push(noise);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(100, ctx.currentTime);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(104, ctx.currentTime);

      const pannerL = ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(-1, ctx.currentTime);
      const pannerR = ctx.createStereoPanner();
      pannerR.pan.setValueAtTime(1, ctx.currentTime);

      const beatGain = ctx.createGain();
      beatGain.gain.setValueAtTime(0.2, ctx.currentTime);

      oscL.connect(pannerL);
      pannerL.connect(beatGain);
      oscR.connect(pannerR);
      pannerR.connect(beatGain);
      beatGain.connect(output);

      oscL.start();
      oscR.start();
      activeSourcesRef.current.push(oscL, oscR);
    } else if (type === 'ticking') {
      let nextTickTime = ctx.currentTime;
      let timerId = null;

      const scheduler = () => {
        while (nextTickTime < ctx.currentTime + 0.1) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(220, nextTickTime);
          filter.Q.value = 6;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, nextTickTime);

          gain.gain.setValueAtTime(0.06, nextTickTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, nextTickTime + 0.04);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(output);

          osc.start(nextTickTime);
          osc.stop(nextTickTime + 0.05);

          nextTickTime += 1.0;
        }
        timerId = setTimeout(scheduler, 50);
      };

      scheduler();
      metronomeRef.current = { stop: () => clearTimeout(timerId) };
    }
  }, [initAudio, stopAmbientSounds]);

  useEffect(() => {
    if (isRunning && soundType !== 'none') {
      startAmbientSound(soundType);
    } else {
      stopAmbientSounds();
    }
  }, [soundType, isRunning, startAmbientSound, stopAmbientSounds]);

  useEffect(() => {
    return () => {
      stopAmbientSounds();
    };
  }, [stopAmbientSounds]);

  return { playZenBell };
}
