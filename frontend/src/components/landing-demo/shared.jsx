'use client';

import { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setReduced(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);

  return reduced;
}

/**
 * Walks through a list of frames, each shown for `frame.ms`.
 * Pauses while `run` is false, calls `onDone` after the last frame.
 * With reduced motion it shows the final frame and never advances.
 */
export function useSteps(frames, run, reduced, onDone) {
  const [i, setI] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reduced || !run) return;
    const t = setTimeout(() => {
      if (i < frames.length - 1) setI(i + 1);
      else doneRef.current?.();
    }, frames[i].ms);
    return () => clearTimeout(t);
  }, [i, run, reduced, frames]);

  return frames[reduced ? frames.length - 1 : i];
}

export function useCountUp(target, reduced, initial = target, ms = 700) {
  const [v, setV] = useState(initial);
  const from = useRef(initial);

  useEffect(() => {
    if (reduced) {
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now) => {
      const k = Math.min((now - start) / ms, 1);
      const val = Math.round(a + (target - a) * (1 - Math.pow(1 - k, 3)));
      from.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, ms]);

  return reduced ? target : v;
}

export const total = (frames) => frames.reduce((s, f) => s + f.ms, 0);

export function Wave({ on, tone = 'muted' }) {
  return (
    <span className={`ld-wave ${tone}${on ? ' on' : ''}`} aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

export function Pomo({ active }) {
  const [s, setS] = useState(24 * 60 + 58);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [active]);
  return (
    <b className="ld-mono ld-amber">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </b>
  );
}

export function Score({ value, start, reduced }) {
  const v = useCountUp(value, reduced, start);
  return <b className="ld-pt">{v} pts</b>;
}
