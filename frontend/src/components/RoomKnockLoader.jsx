'use client';

import { useEffect, useRef, useState } from 'react';
import './room-knock-loader.css';

const LABELS = {
  join: 'Joining room…',
  connect: 'Connecting live…',
  sync: 'Syncing chat and presence…',
  ready: "You're in",
};

const OPEN_HOLD_MS = 1900; // door swing (1.3s) plus time to enjoy the light
const FADE_MS = 500; // overlay fade into the room

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function RoomKnockLoader({
  step = 'join',
  code = '',
  name,
  initials = '?',
  children,
  minMs = 900,
  onOpened,
}) {
  const [minDone, setMinDone] = useState(false);
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'open' | 'leaving' | 'done'

  const onOpenedRef = useRef(onOpened);
  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  // waiting -> open: only when the room is really ready
  useEffect(() => {
    if (step === 'ready' && minDone && phase === 'waiting') {
      setPhase('open');
    }
  }, [step, minDone, phase]);

  // open -> leaving
  useEffect(() => {
    if (phase !== 'open') return;
    const t = setTimeout(() => setPhase('leaving'), reducedMotion() ? 300 : OPEN_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // leaving -> done
  useEffect(() => {
    if (phase !== 'leaving') return;
    const t = setTimeout(
      () => {
        setPhase('done');
        onOpenedRef.current?.();
      },
      reducedMotion() ? 0 : FADE_MS
    );
    return () => clearTimeout(t);
  }, [phase]);

  // If done and children provided, render children directly without wrapper constraints
  if (phase === 'done' && children) {
    return <>{children}</>;
  }

  const cls = [
    'rkl',
    phase === 'waiting' && 'is-knock',
    (phase === 'open' || phase === 'leaving') && 'is-open',
    phase === 'leaving' && 'is-leaving',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      {step === 'ready' && <div className="rkl-room">{children}</div>}

      {phase !== 'done' && (
        <div className="rkl-overlay" role="status" aria-live="polite">
          <div className="rkl-meta">
            {code && <span className="rkl-code">{code}</span>}
            <h2 className="rkl-name">{name ?? 'Entering room'}</h2>
          </div>

          <svg
            className="rkl-scene"
            viewBox="0 0 680 380"
            role="img"
            aria-label="A figure knocks on a door that opens with warm light"
          >
            <line x1="60" y1="300" x2="620" y2="300" stroke="rgba(255,255,255,.08)" />

            <g className="rkl-spill">
              <polygon points="350,300 380,300 500,332 232,332" fill="#f5a623" fillOpacity=".10" />
              <polygon points="352,300 378,300 440,326 292,326" fill="#f5a623" fillOpacity=".16" />
            </g>

            <rect className="rkl-halo" x="296" y="126" width="88" height="178" rx="3" fill="none" stroke="#f5a623" strokeOpacity=".35" />
            <rect x="300" y="130" width="80" height="170" fill="#f5a623" fillOpacity=".92" />

            <g className="rkl-door">
              <g className="rkl-shake">
                <rect x="300" y="130" width="80" height="170" fill="#17171d" stroke="rgba(255,255,255,.16)" />
                <rect x="310" y="142" width="26" height="62" rx="2" fill="none" stroke="rgba(255,255,255,.07)" />
                <rect x="344" y="142" width="26" height="62" rx="2" fill="none" stroke="rgba(255,255,255,.07)" />
                <rect x="310" y="214" width="60" height="74" rx="2" fill="none" stroke="rgba(255,255,255,.07)" />
                <circle cx="368" cy="222" r="3" fill="#a1a1ad" />
              </g>
            </g>

            <circle className="rkl-rip" cx="300" cy="215" r="26" fill="none" stroke="#a1a1ad" strokeWidth="1.5" />

            <g>
              <circle cx="210" cy="200" r="16" fill="#2a2a33" />
              <rect x="192" y="220" width="36" height="62" rx="14" fill="#2a2a33" />
              <rect x="196" y="276" width="12" height="24" rx="3" fill="#2a2a33" />
              <rect x="212" y="276" width="12" height="24" rx="3" fill="#2a2a33" />
              <text x="210" y="256" textAnchor="middle" fontSize="12" fill="#a1a1ad">
                {initials}
              </text>
              <g className="rkl-arm">
                <line x1="226" y1="236" x2="288" y2="236" stroke="#2a2a33" strokeWidth="9" strokeLinecap="round" />
                <circle cx="291" cy="236" r="6" fill="#2a2a33" />
              </g>
              <g className="rkl-rim" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round">
                <path d="M218 187 A16 16 0 0 1 218 213" />
                <path d="M228 228 L228 270" />
              </g>
            </g>
          </svg>

          <p className="rkl-label">{LABELS[step] || LABELS.join}</p>
        </div>
      )}
    </div>
  );
}

export { RoomKnockLoader };
