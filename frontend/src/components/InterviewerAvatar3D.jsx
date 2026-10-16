'use client';

import React, { useMemo } from 'react';

/**
 * High-performance, lightweight Neural Voice Holographic Orb
 * Replaces heavy WebGL 3D meshes to guarantee 60fps fluid UI responsiveness,
 * unblocking camera video, proctoring face detection, and continuous speech capture.
 */
export default function InterviewerAvatar3D({ state = 'idle', speechRhythm = 0, audioLevel = 0 }) {
  // Theme and status configuration by state
  const config = useMemo(() => {
    switch (state) {
      case 'speaking':
        return {
          label: 'AI Speaking...',
          color: '#a78bfa',
          glow: 'rgba(167, 139, 250, 0.45)',
          border: 'rgba(167, 139, 250, 0.5)',
          bgTint: 'rgba(167, 139, 250, 0.12)',
          gradient: 'radial-gradient(circle at 35% 35%, #c084fc 0%, #7c3aed 50%, #4c1d95 100%)',
          ringColor: 'rgba(192, 132, 252, 0.4)',
        };
      case 'listening':
        return {
          label: 'Listening to your answer...',
          color: '#34d399',
          glow: 'rgba(52, 211, 153, 0.45)',
          border: 'rgba(52, 211, 153, 0.5)',
          bgTint: 'rgba(52, 211, 153, 0.12)',
          gradient: 'radial-gradient(circle at 35% 35%, #6ee7b7 0%, #10b981 50%, #064e3b 100%)',
          ringColor: 'rgba(52, 211, 153, 0.4)',
        };
      case 'thinking':
        return {
          label: 'Evaluating response...',
          color: '#fbbf24',
          glow: 'rgba(251, 191, 36, 0.45)',
          border: 'rgba(251, 191, 36, 0.5)',
          bgTint: 'rgba(251, 191, 36, 0.12)',
          gradient: 'radial-gradient(circle at 35% 35%, #fde68a 0%, #f59e0b 50%, #78350f 100%)',
          ringColor: 'rgba(251, 191, 36, 0.4)',
        };
      default: // idle
        return {
          label: 'Ready for your response',
          color: '#94a3b8',
          glow: 'rgba(148, 163, 184, 0.25)',
          border: 'rgba(255, 255, 255, 0.1)',
          bgTint: 'rgba(255, 255, 255, 0.04)',
          gradient: 'radial-gradient(circle at 35% 35%, #cbd5e1 0%, #475569 50%, #0f172a 100%)',
          ringColor: 'rgba(148, 163, 184, 0.2)',
        };
    }
  }, [state]);

  // Modulate equalizer activity based on state and inputs
  const waveformHeights = useMemo(() => {
    if (state === 'speaking') {
      const boost = speechRhythm > 0 ? speechRhythm : 0.6;
      return [0.4, 0.7, 0.95, 0.6, 0.85, 0.5, 0.9, 0.65].map(v => Math.max(0.2, v * boost));
    }
    if (state === 'listening') {
      const norm = Math.min(1, Math.max(0.15, (audioLevel || 20) / 75));
      return [0.35, 0.65, 0.85, 0.55, 0.9, 0.7, 0.6, 0.4].map(v => Math.max(0.2, v * norm));
    }
    if (state === 'thinking') {
      return [0.3, 0.45, 0.6, 0.45, 0.6, 0.45, 0.3, 0.25];
    }
    return [0.2, 0.25, 0.3, 0.25, 0.3, 0.25, 0.2, 0.15];
  }, [state, speechRhythm, audioLevel]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 0',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.15); }
        }
        @keyframes orb-thinking-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orb-reverse-spin {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes orb-ripple {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes orb-wave-bounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes orb-pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.96); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
      `}</style>

      {/* Main Hologram Container */}
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Ambient Radial Backlight */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
            filter: 'blur(16px)',
            pointerEvents: 'none',
            animation: state !== 'idle' ? 'orb-pulse-glow 2.2s ease-in-out infinite' : 'none',
          }}
        />

        {/* Resonant Acoustic Ripple Rings (Active during Speaking & Listening) */}
        {(state === 'speaking' || state === 'listening') && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `2px solid ${config.ringColor}`,
                animation: 'orb-ripple 2.4s cubic-bezier(0.2, 0.8, 0.4, 1) infinite',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1.5px solid ${config.ringColor}`,
                animation: 'orb-ripple 2.4s cubic-bezier(0.2, 0.8, 0.4, 1) infinite',
                animationDelay: '1.2s',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* Synaptic Orbital Gyro Rings (Active during Thinking) */}
        {state === 'thinking' && (
          <>
            <div
              style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(251, 191, 36, 0.65)',
                animation: 'orb-thinking-spin 4s linear infinite',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '165px',
                height: '165px',
                borderRadius: '50%',
                border: '1px dotted rgba(251, 191, 36, 0.4)',
                animation: 'orb-reverse-spin 6s linear infinite',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* Static Ambient Boundary Orbit (Subtle HUD ring) */}
        <div
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: `1px solid ${config.ringColor}`,
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* The Central Glowing Neural Sphere */}
        <div
          style={{
            width: '104px',
            height: '104px',
            borderRadius: '50%',
            background: config.gradient,
            boxShadow: `0 0 35px ${config.glow}, inset 0 0 20px rgba(255, 255, 255, 0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            animation: state === 'speaking'
              ? 'orb-breathe 1.2s ease-in-out infinite'
              : state === 'listening'
              ? 'orb-breathe 1.8s ease-in-out infinite'
              : 'orb-breathe 3.5s ease-in-out infinite',
            transition: 'all 0.4s ease',
          }}
        >
          {/* Internal Specular Glass Highlight */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '18px',
              width: '36px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0) 100%)',
              transform: 'rotate(-25deg)',
              pointerEvents: 'none',
            }}
          />

          {/* Center Soundwave Equalizer Bars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '38px',
              zIndex: 3,
            }}
          >
            {waveformHeights.map((h, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '3px',
                  boxShadow: `0 0 6px ${config.color}`,
                  transform: `scaleY(${h})`,
                  transformOrigin: 'center',
                  animation: state !== 'idle' ? `orb-wave-bounce ${0.6 + (i % 3) * 0.2}s ease-in-out infinite` : 'none',
                  animationDelay: `${i * 0.08}s`,
                  transition: 'transform 0.15s ease',
                  opacity: state === 'idle' ? 0.45 : 0.95,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modern Status Badge */}
      <div
        style={{
          marginTop: '0.75rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          background: config.bgTint,
          border: `1px solid ${config.border}`,
          backdropFilter: 'blur(6px)',
          transition: 'all 0.3s ease',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 8px ${config.color}`,
            animation: state !== 'idle' ? 'orb-pulse-glow 1.4s ease-in-out infinite' : 'none',
          }}
        />
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: config.color,
            whiteSpace: 'nowrap',
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
