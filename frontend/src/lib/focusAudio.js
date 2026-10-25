/**
 * Web Audio API synthesizer utilities for focus timer sound effects.
 */

export function initAudioContext(audioCtxRef, masterGainRef, isMuted, volume) {
  if (!audioCtxRef.current) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtxRef.current = new AudioContextClass();
    masterGainRef.current = audioCtxRef.current.createGain();
    masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioCtxRef.current.currentTime);
    masterGainRef.current.connect(audioCtxRef.current.destination);
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
}

export function stopAudioSources(activeSourcesRef, metronomeRef) {
  activeSourcesRef.current.forEach(src => {
    try { src.stop(); } catch(e) {}
  });
  activeSourcesRef.current = [];
  if (metronomeRef.current) {
    metronomeRef.current.stop();
    metronomeRef.current = null;
  }
}

export function playZenBellSound(audioCtxRef) {
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
}
