'use client';

import { Zap, Flame, ShieldAlert, Users2, Play } from 'lucide-react';

export default function RoomArenaChooser({
  isTimerExpanded,
  isMobile,
  participantsList,
  setGameMode,
  setShowCreateChallengeModal,
  toast
}) {
  const arenas = [
    {
      mode: 'STANDARD',
      icon: Zap,
      title: 'OA Blitz',
      badge: 'Free-For-All',
      players: '1+ Players',
      minPlayers: 1,
      desc: 'Speed sprint with individual ranking & reflex bonuses.'
    },
    {
      mode: 'BOSS',
      icon: Flame,
      title: 'Co-op Boss Battle',
      badge: 'Shared HP',
      players: '2+ Players',
      minPlayers: 2,
      desc: 'Collaborate to defeat the Algorithmic Dragon with shared HP.'
    },
    {
      mode: 'SURVIVAL',
      icon: ShieldAlert,
      title: 'Survival Arena',
      badge: 'Sudden-Death',
      players: '2+ Players',
      minPlayers: 2,
      desc: 'Sudden-death elimination. Answer wrong and switch to spectator.'
    },
    {
      mode: 'TEAMS',
      icon: Users2,
      title: 'Squad Battle',
      badge: 'Blue vs Violet',
      players: '2+ Players',
      minPlayers: 2,
      desc: 'Team Alpha (Blue) vs Team Beta (Violet) aggregate squad match.'
    },
  ];

  return (
    <div className="card glass-panel" style={{
      padding: isTimerExpanded ? '0 1.5rem' : '1.5rem 1.75rem',
      maxHeight: isTimerExpanded ? '0px' : '450px',
      opacity: isTimerExpanded ? 0 : 1,
      overflow: 'hidden',
      borderRadius: '18px',
      background: 'var(--bg-surface)',
      border: isTimerExpanded ? '0px solid transparent' : '1px solid var(--border-light)',
      flexShrink: 0,
      pointerEvents: isTimerExpanded ? 'none' : 'auto',
      transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, padding 0.4s ease, border 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.22rem', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Choose an Arena
          </h3>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Multiplayer challenge modes for instant co-working practice
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '1.25rem',
        minHeight: 0
      }}>
        {arenas.map(arena => {
          const isLaunchable = participantsList.length >= arena.minPlayers;
          return (
            <div
              key={arena.mode}
              onClick={() => {
                if (!isLaunchable) {
                  if (toast) toast.info(`${arena.title} requires at least ${arena.minPlayers} peers in the room.`);
                  return;
                }
                setGameMode(arena.mode);
                setShowCreateChallengeModal(true);
              }}
              className="card"
              style={{
                padding: '1.3rem 1.35rem',
                minHeight: '185px',
                cursor: isLaunchable ? 'pointer' : 'default',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderRadius: '16px',
                transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                opacity: isLaunchable ? 1 : 0.85
              }}
              onMouseEnter={(e) => {
                if (isLaunchable) {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ minHeight: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    {arena.badge}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-light)', color: isLaunchable ? 'var(--text-secondary)' : '#f59e0b' }}>
                    {arena.players}
                  </span>
                </div>

                <div style={{ fontWeight: 900, fontSize: '1.12rem', color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {arena.title}
                </div>

                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.68)',
                  lineHeight: 1.5,
                  margin: 0,
                  minHeight: '38px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {arena.desc}
                </p>
              </div>

              <button
                type="button"
                disabled={!isLaunchable}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLaunchable) {
                    if (toast) toast.info(`${arena.title} requires at least ${arena.minPlayers} peers in the room.`);
                    return;
                  }
                  setGameMode(arena.mode);
                  setShowCreateChallengeModal(true);
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '0.9rem',
                  borderRadius: '10px',
                  flexShrink: 0,
                  opacity: isLaunchable ? 1 : 0.45,
                  cursor: isLaunchable ? 'pointer' : 'not-allowed'
                }}
                title={isLaunchable ? 'Launch arena challenge' : `Needs ${arena.minPlayers}+ peers in room to launch`}
              >
                <Play size={12} fill="currentColor" /> Launch
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
