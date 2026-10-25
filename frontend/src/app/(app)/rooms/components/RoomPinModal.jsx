'use client';
import { Lock } from 'lucide-react';

export default function RoomPinModal({
  room,
  pinInput,
  setPinInput,
  pinVerifying,
  onClose,
  onSubmit,
}) {
  if (!room) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '90%',
          maxWidth: '380px',
          padding: 'var(--space-lg)',
          animation: 'fadeIn 0.2s ease-out',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}
        >
          <Lock size={22} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Private Room</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Enter the 4-digit PIN to join <strong>{room.title}</strong>
        </p>

        <form onSubmit={onSubmit}>
          <input
            type="password"
            maxLength={4}
            autoFocus
            placeholder="••••"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '160px',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '1.5rem',
              letterSpacing: '0.4em',
              textAlign: 'center',
              fontWeight: 800,
              outline: 'none',
              margin: '0 auto 1.5rem auto',
              display: 'block',
            }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pinInput.length < 4 || pinVerifying}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {pinVerifying ? 'Checking...' : 'Enter Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
