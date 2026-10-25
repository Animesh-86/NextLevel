'use client';

import { Sparkles, RefreshCw, Plus, Compass, Volume2, VolumeX } from 'lucide-react';

export default function BubblePitControls({
  activeBubbleCount,
  maxBubbles,
  gravityMode,
  setGravityMode,
  soundEnabled,
  setSoundEnabled,
  onSpawnBatch,
  onClearBubbles
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        pointerEvents: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#34d399'
          }}
        >
          <Sparkles size={12} /> Tech Bubble Pit
        </span>

        <span
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          {activeBubbleCount}/{maxBubbles} Spheres
        </span>
      </div>

      {/* Action Buttons */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'auto' }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gravity Cycle */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setGravityMode((prev) => (prev === 'down' ? 'zero' : prev === 'zero' ? 'up' : 'down'));
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#f4f4f6',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
          title="Cycle Gravity (Normal / Zero-G / Inverted)"
        >
          <Compass size={12} /> {gravityMode === 'down' ? '1G Normal' : gravityMode === 'zero' ? '0G Space' : 'Anti-G'}
        </button>

        {/* Sound On / Muted Toggle */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled((prev) => !prev);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: soundEnabled ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
            border: soundEnabled ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: soundEnabled ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
          title={soundEnabled ? 'Collision sound enabled (Click to mute)' : 'Collision sound muted (Click to unmute)'}
        >
          {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
        </button>

        {/* Spawn +3 */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={onSpawnBatch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
          title="Spawn more tech bubbles"
        >
          <Plus size={12} /> Spawn
        </button>

        {/* Reset / Clear */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={onClearBubbles}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
          title="Clear all bubbles"
        >
          <RefreshCw size={11} />
        </button>
      </div>
    </div>
  );
}
