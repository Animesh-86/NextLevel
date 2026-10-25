'use client';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteRoomModal({
  room,
  deleting,
  onClose,
  onConfirm,
}) {
  if (!room) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div style={{
        background: '#111318',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        padding: '1.75rem',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            flexShrink: 0
          }}>
            <Trash2 size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
              Delete Study Room
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to close and permanently delete <strong style={{ color: '#ffffff' }}>&ldquo;{room.title}&rdquo;</strong>? All active challenges, chat history, and peer connections will be removed. This cannot be undone.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = '#ef4444'; }}
          >
            {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            <span>{deleting ? 'Deleting Room...' : 'Delete Room'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
