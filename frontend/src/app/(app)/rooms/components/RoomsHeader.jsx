'use client';
import { Users, Plus } from 'lucide-react';

export default function RoomsHeader({
  onOpenCreate,
  roomCodeInput,
  setRoomCodeInput,
  onJoinWithCode,
  joiningCode,
}) {
  return (
    <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Users size={13} /> Peer Co-Working & Arena
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
            Collaborative Study Rooms
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Co-work with peers, launch instant OA Blitz challenge sprints, and track real-time scores and leaderboards together.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenCreate}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Create Room
          </button>
        </div>
      </div>

      {/* Quick Join With Code Bar */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Have a Room Code?</span>
          <form onSubmit={onJoinWithCode} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="e.g. NL-4821"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              style={{
                width: '130px',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                textTransform: 'uppercase',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!roomCodeInput.trim() || joiningCode}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            >
              {joiningCode ? 'Joining...' : 'Join'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Live Presence & Speed Challenges
          </span>
        </div>
      </div>
    </header>
  );
}
