'use client';

import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export default function FocusControls({
  isRunning,
  resetTimer,
  handleTogglePlay,
  isMuted,
  setIsMuted,
  soundType
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        type="button"
        className="icon-btn"
        onClick={resetTimer}
        title="Reset Session"
        style={{
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f4f4f6',
          cursor: 'pointer'
        }}
      >
        <RotateCcw size={15} />
      </button>

      <button
        type="button"
        onClick={handleTogglePlay}
        style={{
          padding: '0.85rem 2rem',
          background: isRunning ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
          color: isRunning ? '#ffffff' : '#000000',
          border: isRunning ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
          borderRadius: '32px',
          fontSize: '0.92rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isRunning ? 'none' : '0 4px 18px rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {isRunning ? (
          <>
            <Pause size={16} fill="currentColor" /> Pause
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" /> Start Focus
          </>
        )}
      </button>

      <button
        type="button"
        className="icon-btn"
        onClick={() => setIsMuted(!isMuted)}
        title={isMuted ? 'Unmute sound' : 'Mute sound'}
        disabled={soundType === 'none'}
        style={{
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f4f4f6',
          opacity: soundType === 'none' ? 0.35 : 1,
          cursor: soundType === 'none' ? 'not-allowed' : 'pointer'
        }}
      >
        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
}
