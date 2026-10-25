'use client';
import { Clock, Lock, Trash2, ArrowRight } from 'lucide-react';

export default function RoomCard({ room, currentUserId, onClick, onDelete }) {
  const count = room.participantCount || (room.participants ? room.participants.length : 0);
  const isMyRoom = currentUserId && (room.hostUserId === currentUserId);

  let expiryLabel = 'No Expiry';
  if (room.expiresAt) {
    const diffMs = new Date(room.expiresAt) - new Date();
    if (diffMs > 0) {
      const diffMins = Math.ceil(diffMs / (1000 * 60));
      expiryLabel = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m left` : `${diffMins}m left`;
    } else {
      expiryLabel = 'Expiring soon';
    }
  }

  return (
    <div
      className="card"
      onClick={() => onClick(room)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        border: '1px solid var(--border-strong)',
        background: 'var(--bg-surface)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--text-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
    >
      <div>
        {/* Top Bar inside card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
              {room.roomCode}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} /> {expiryLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {room.isPrivate ? (
              <span title="Private Room - 4 Digit PIN Required" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                <Lock size={14} />
              </span>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                {count} peer{count !== 1 ? 's' : ''}
              </span>
            </div>

            {isMyRoom && (
              <button
                onClick={(e) => onDelete(room, e)}
                title="Close & Delete this room"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Room Title & Description */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.3 }}>
          {room.title}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {room.description || 'Collaborative study & OA Blitz practice session. Jump in, share your goal, and study together.'}
        </p>
      </div>

      {/* Footer metadata */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
          <span>Host: <strong style={{ color: 'var(--text-primary)' }}>{room.hostUserName || 'Student'}</strong></span>
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
        >
          <span>Enter Room</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
