'use client';

import {
  ShieldAlert,
  Maximize2,
  ArrowLeft,
  Clock,
  Copy,
  Check,
  LogOut,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';

export default function RoomHeader({
  isChallengeActive,
  stageState,
  activeChallenge,
  proctorWarnings,
  isFullscreenActive,
  handleCancelChallenge,
  isZenMode,
  setIsZenMode,
  isMobile,
  room,
  router,
  setActiveTab,
  setRightRailTab,
  isChatCollapsed,
  setChatCollapsedManually,
  participantsList,
  expiryDisplay,
  isExpiryAmber,
  showExpiryPopover,
  setShowExpiryPopover,
  isHost,
  handleAdjustRoomTimer,
  myGoal,
  setGoalInput,
  setShowGoalModal,
  copyRoomLink,
  copiedLink,
  handleExitRoom,
  showMoreMenu,
  setShowMoreMenu,
  setShowCloseConfirmModal,
}) {
  if (isChallengeActive && stageState !== 'live_question') {
    return (
      <div style={{
        padding: '0.65rem 1.25rem',
        borderRadius: '12px',
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#f59e0b'
          }}>
            <ShieldAlert size={14} />
            <span>PROCTORED SPRINT ACTIVE</span>
          </div>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
            {activeChallenge?.title || 'Arena Challenge'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {proctorWarnings > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.76rem',
              fontWeight: 800
            }}>
              ⚠️ Infractions: {proctorWarnings}/3
            </div>
          )}

          {!isFullscreenActive && (
            <button
              type="button"
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="btn btn-secondary"
              style={{ padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Maximize2 size={13} /> Re-enter Fullscreen
            </button>
          )}

          <button
            type="button"
            onClick={handleCancelChallenge}
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.74rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            Exit Sprint
          </button>
        </div>
      </div>
    );
  }

  if (isZenMode) {
    return (
      <div style={{
        padding: '0.5rem 1rem',
        borderRadius: '12px',
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>🧘 Zen Mode Active</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {room?.title}</span>
        </div>
        <button
          onClick={() => setIsZenMode(false)}
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
        >
          Exit Zen
        </button>
      </div>
    );
  }

  return (
    <header className="glass-panel" style={{
      padding: '0.85rem 1.5rem',
      minHeight: '64px',
      height: isMobile ? 'auto' : '64px',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: '1.25rem',
      flexShrink: 0
    }}>
      {/* Left Side: ← RoomTitle | 🟢 N online · ⏳ Expires in 43m ▾ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/rooms')}
          className="icon-btn"
          style={{ color: 'var(--text-secondary)' }}
          title="Back to Study Rooms"
        >
          <ArrowLeft size={19} />
        </button>

        <h1 style={{ fontSize: '1.22rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          {room?.title}
        </h1>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 2px' }} />

        {/* Grouped Room Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Live Presence Indicator (Green): 🟢 N online */}
          <button
            onClick={() => {
              if (isMobile) {
                setActiveTab('chat');
              }
              setRightRailTab('people');
              if (isChatCollapsed) setChatCollapsedManually(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '3px 10px',
              cursor: 'pointer',
              color: '#10b981',
              transition: 'all 0.15s ease'
            }}
            title="Click to view peers in People tab"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
              {participantsList.length} online
            </span>
          </button>

          {/* Expiry Chip: Only show dropdown & timer controls if room has an expiry */}
          {room?.expiresAt && expiryDisplay !== 'No Expiry' ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExpiryPopover(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isExpiryAmber ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isExpiryAmber ? 'rgba(245, 158, 11, 0.5)' : 'var(--border-light)'}`,
                  color: isExpiryAmber ? '#f59e0b' : 'var(--text-secondary)',
                  padding: '3px 9px',
                  borderRadius: '14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={`Room session expires in ${expiryDisplay}. Click for host duration controls.`}
              >
                <Clock size={12} />
                <span>Expires in {expiryDisplay}</span>
                <span style={{ fontSize: '0.62rem' }}>▾</span>
              </button>

              {showExpiryPopover && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '125%',
                    zIndex: 250,
                    width: '220px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Room Timer Controls
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Expires in: <strong style={{ color: isExpiryAmber ? '#f59e0b' : 'var(--text-primary)' }}>{expiryDisplay}</strong>
                  </div>

                  {isHost ? (
                    <>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Host Extension Options:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                        {[
                          { label: '+5 Min', m: 5 },
                          { label: '+15 Min', m: 15 },
                          { label: '+30 Min', m: 30 },
                          { label: '-5 Min', m: -5 },
                        ].map(ext => (
                          <button
                            key={ext.m}
                            onClick={() => {
                              handleAdjustRoomTimer(ext.m);
                              setShowExpiryPopover(false);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px', fontSize: '0.74rem', fontWeight: 700 }}
                          >
                            {ext.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                      Only the room host can adjust room duration.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
                padding: '3px 9px',
                borderRadius: '14px',
                fontSize: '0.76rem',
                fontWeight: 600,
                userSelect: 'none'
              }}
            >
              <span>No Expiry</span>
            </div>
          )}
        </div>

        {/* Session Goal Chip in Header (No emoji icon) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '3px 10px',
          fontSize: '0.78rem'
        }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Goal:</span>
          <span style={{
            maxWidth: '220px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: myGoal ? 'var(--text-primary)' : 'var(--text-muted)',
            fontStyle: myGoal ? 'normal' : 'italic',
            fontWeight: 600
          }}>
            {myGoal ? `"${myGoal}"` : 'No goal set'}
          </span>
          <button
            onClick={() => { setGoalInput(myGoal); setShowGoalModal(true); }}
            className="btn btn-secondary"
            style={{ padding: '1px 7px', fontSize: '0.72rem', height: '22px', borderRadius: '8px', fontWeight: 700 }}
          >
            {myGoal ? 'Edit' : 'Set'}
          </button>
        </div>
      </div>

      {/* Right Side: Audio Popover, Exit, More (⋯) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {participantsList.length < 2 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Invite:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '4px' }}>
              {room?.roomCode}
            </span>
            <button
              onClick={copyRoomLink}
              className="btn btn-secondary"
              style={{ padding: '2px 7px', fontSize: '0.72rem', height: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Copy room invite link"
            >
              {copiedLink ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Exit Button */}
        <button
          onClick={handleExitRoom}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <LogOut size={14} /> Exit
        </button>

        {/* More Options (⋯) Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMoreMenu(prev => !prev)}
            className="icon-btn"
            style={{ color: 'var(--text-secondary)', padding: '6px' }}
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMoreMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                zIndex: 200,
                width: '200px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <button
                onClick={() => { copyRoomLink(); setShowMoreMenu(false); }}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Copy size={14} /> Copy Room Link
              </button>

              {isHost && (
                <button
                  onClick={() => { setShowCloseConfirmModal(true); setShowMoreMenu(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700
                  }}
                >
                  <Trash2 size={14} /> Close Room (Host)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
