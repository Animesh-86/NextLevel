'use client';
import { KeyRound, X } from 'lucide-react';

export default function DashboardJoinRoomModal({
  isOpen,
  onClose,
  joinCodeInput,
  setJoinCodeInput,
  handleJoinRoom,
  isJoining,
}) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '16px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Join Study Room</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
          Enter the unique 6-character room code to join your peers in real-time focus & arena sprints.
        </p>

        <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '6px' }}>
              ROOM CODE
            </label>
            <input 
              type="text" 
              placeholder="NL-0000" 
              autoFocus
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              style={{ 
                width: '100%', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                color: 'var(--text)', 
                fontSize: '1.25rem', 
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '0.75rem 1rem', 
                borderRadius: '10px',
                outline: 'none',
                letterSpacing: '0.1em',
                textAlign: 'center',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="dash-btn-ghost"
              style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-strong)', 
                color: 'var(--text)', 
                fontSize: '0.84rem', 
                fontWeight: 600, 
                padding: '0.65rem 1.15rem', 
                borderRadius: '8px', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isJoining || !joinCodeInput.trim()}
              className="dash-btn-primary"
              style={{ 
                background: 'var(--btn-bg)', 
                border: 'none', 
                color: 'var(--btn-text)', 
                fontSize: '0.84rem', 
                fontWeight: 700, 
                padding: '0.65rem 1.4rem', 
                borderRadius: '8px', 
                cursor: isJoining ? 'not-allowed' : 'pointer',
                opacity: isJoining || !joinCodeInput.trim() ? 0.6 : 1
              }}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
