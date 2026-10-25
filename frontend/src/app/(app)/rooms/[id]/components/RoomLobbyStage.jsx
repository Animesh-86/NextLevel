'use client';

import { Zap, Crown, Play } from 'lucide-react';

export default function RoomLobbyStage({
  stageState,
  activeChallenge,
  participantsList,
  currentUserId,
  room,
  lobbyCountdown,
  isMobile,
  setIsFullscreenActive,
  handleStartChallenge,
  handleCancelChallenge
}) {
  if (stageState !== 'invite_open' || !activeChallenge) return null;

  const chMode = (activeChallenge.gameMode || 'STANDARD').toUpperCase();
  const teamAlphaPeers = participantsList.filter((_, idx) => idx % 2 === 0);
  const teamBetaPeers = participantsList.filter((_, idx) => idx % 2 !== 0);
  const countdownSecs = lobbyCountdown !== null ? lobbyCountdown : 30;

  return (
    <div className="card glass-panel" style={{
      flex: 1,
      padding: '1.75rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderRadius: '16px',
      background: 'rgba(15, 17, 23, 0.95)',
      border: '1px solid var(--border-light)'
    }}>
      <div>
        {/* Mode Badge & Sprint Title */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: chMode === 'BOSS' ? 'rgba(239, 68, 68, 0.15)' : chMode === 'SURVIVAL' ? 'rgba(168, 85, 247, 0.15)' : chMode === 'TEAMS' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem', color: chMode === 'BOSS' ? '#f87171' : chMode === 'SURVIVAL' ? '#c084fc' : chMode === 'TEAMS' ? '#60a5fa' : '#f59e0b' }}>
          <Zap size={14} />
          <span>{chMode === 'BOSS' ? 'Co-op Boss Battle Ready' : chMode === 'SURVIVAL' ? 'Sudden-Death Survival Ready' : chMode === 'TEAMS' ? 'Squad Team Battle Ready' : 'OA Blitz Challenge Ready'}</span>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '0 0 1.5rem 0' }}>
          {activeChallenge.title}
        </h2>

        {/* ─── TWO COLUMN LOBBY (ELIMINATES DEAD SPACE) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          {/* LEFT COLUMN: ROUND TIMER & METADATA IN BLOCKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Round Timer Block */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              boxShadow: '0 0 25px -5px rgba(245, 158, 11, 0.15)'
            }}>
              {/* Circular Countdown Ring */}
              <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#f59e0b"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - (countdownSecs / 30))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  color: '#ffffff'
                }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: '#f59e0b' }}>
                    {countdownSecs}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                    SEC
                  </span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff' }}>
                    Lobby Countdown Active
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', padding: '1px 6px', borderRadius: '6px' }}>
                    Auto-start
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  The challenge will automatically begin when the timer reaches 0, or the host can launch immediately.
                </p>
              </div>
            </div>

            {/* Sprint Parameters Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Questions
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                  {activeChallenge.questionCount || 10}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Time / Q
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>
                  {activeChallenge.perQuestionSeconds || 30}s
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Est.
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                  {Math.round(((activeChallenge.questionCount || 10) * (activeChallenge.perQuestionSeconds || 30)) / 60)}m
                </div>
              </div>
            </div>

            {/* Mode-Specific Rules Highlight */}
            {chMode === 'BOSS' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f87171', marginBottom: '2px' }}>
                  🔥 Algorithmic Boss Rules
                </div>
                <div style={{ fontSize: '0.76rem', color: '#fca5a5' }}>
                  All peers damage the boss on correct answers. Wrong answers deal splash damage to team health!
                </div>
              </div>
            )}

            {chMode === 'SURVIVAL' && (
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#c084fc', marginBottom: '2px' }}>
                  🛡️ Sudden-Death Survival
                </div>
                <div style={{ fontSize: '0.76rem', color: '#e9d5ff' }}>
                  1 Life each. Answering incorrectly or timing out eliminates you to Spectator Mode!
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: JOINED PARTICIPANTS */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Joined Participants
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                {participantsList.length} Connected
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
              {participantsList.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#ffffff'
                    }}>
                      {(p.userName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{p.userName}</span>
                        {p.userId === currentUserId && (
                          <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>(You)</span>
                        )}
                        {p.userId === room?.hostUserId && (
                          <Crown size={13} style={{ color: '#f59e0b' }} title="Host" />
                        )}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Ready
                  </span>
                </div>
              ))}
            </div>

            {/* Squad Breakdown (if TEAMS mode) */}
            {chMode === 'TEAMS' && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <strong style={{ color: '#60a5fa' }}>🔵 Team Alpha:</strong> {teamAlphaPeers.map(p => p.userName).join(', ')}
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <strong style={{ color: '#f87171' }}>🔴 Team Beta:</strong> {teamBetaPeers.map(p => p.userName).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Launch Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => {
            if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen && !document.fullscreenElement) {
              document.documentElement.requestFullscreen().then(() => setIsFullscreenActive(true)).catch(() => {});
            }
            handleStartChallenge(activeChallenge);
          }}
          className="btn btn-primary"
          style={{ padding: '0.85rem 2.25rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Play size={18} /> {chMode === 'BOSS' ? 'Battle the Boss' : chMode === 'SURVIVAL' ? 'Enter Survival Arena' : chMode === 'TEAMS' ? 'Launch Squad Match' : 'Start Blitz Challenge'} {countdownSecs > 0 ? `(${countdownSecs}s)` : ''}
        </button>

        <button
          onClick={handleCancelChallenge}
          className="btn btn-secondary"
          style={{ padding: '0.85rem 1.5rem', fontWeight: 700 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
