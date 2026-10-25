'use client';

import React from 'react';
import {
  Users,
  X,
  Crown,
  Target,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export function RoomPeerPresenceModal({
  showPeersModal,
  setShowPeersModal,
  participantsList = [],
  currentUserId,
  room,
  setGoalInput,
  myGoal,
  setShowGoalModal,
  isHost,
  handleTransferHost,
  handleKickUser
}) {
  if (!showPeersModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setShowPeersModal(false);
      }}
    >
      <div
        className="glass-panel"
        style={{ width: '90%', maxWidth: '420px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              Active Peers ({participantsList.length} Online)
            </h3>
          </div>
          <button onClick={() => setShowPeersModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {participantsList.map((p, idx) => {
            const isMe = p.userId === currentUserId;
            const isPeerHost = p.userId === room?.hostUserId;

            return (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isMe ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface)',
                  border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isMe ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.15)',
                      color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p.userName ? p.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{p.userName}</span>
                      {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(You)</span>}
                    </div>
                    {p.goal ? (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                        🎯 &ldquo;{p.goal}&rdquo;
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Connected</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPeerHost && (
                    <span title="Room Host" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                      <Crown size={16} />
                    </span>
                  )}

                  {isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        setGoalInput(myGoal);
                        setShowPeersModal(false);
                        setShowGoalModal(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                    >
                      Edit Goal
                    </button>
                  )}

                  {isHost && !isMe && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransferHost(p.userId)}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        title="Make room host"
                      >
                        Make Host
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKickUser(p.userId)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                        title="Remove from room"
                      >
                        Kick
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RoomSessionGoalModal({
  showGoalModal,
  setShowGoalModal,
  handleSaveGoal,
  goalInput,
  setGoalInput
}) {
  if (!showGoalModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setShowGoalModal(false);
      }}
    >
      <div className="glass-panel" style={{ width: '92%', maxWidth: '480px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Set Session Goal</h2>
          </div>
          <button onClick={() => setShowGoalModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              What are you focusing on during this session?
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Solve 3 LeetCode DP problems, finish IoT module 2"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem'
              }}
            />
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Quick suggestions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'Solve 3 LeetCode Mediums',
                'Complete IoT Week 1 sprint',
                'Deep dive on System Design',
                'Review 20 Flashcards',
                'Debug backend microservices'
              ].map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setGoalInput(sug)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    border: '1px solid var(--border-light)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowGoalModal(false)}
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontWeight: 800 }}
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoomCloseConfirmModal({
  showCloseConfirmModal,
  setShowCloseConfirmModal,
  participantsList = [],
  handleCloseRoom
}) {
  if (!showCloseConfirmModal) return null;

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
        backdropFilter: 'blur(4px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setShowCloseConfirmModal(false);
      }}
    >
      <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <AlertTriangle size={26} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          Close Study Room?
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          There {participantsList.length === 1 ? 'is' : 'are'} currently <strong>{participantsList.length} participant{participantsList.length !== 1 ? 's' : ''}</strong> inside. Closing the room will terminate the session and disconnect all peers immediately.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setShowCloseConfirmModal(false)}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Keep Open
          </button>
          <button
            type="button"
            onClick={handleCloseRoom}
            className="btn btn-primary"
            style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}
          >
            Close Room
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoomDisqualifiedModal({
  disqualifiedReason,
  setDisqualifiedReason,
  proctorWarningsRef,
  lastInfractionTimeRef,
  setProctorWarnings
}) {
  if (!disqualifiedReason) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100001,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#13141a',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '460px',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}
        >
          <ShieldAlert size={30} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
            Disqualified from Challenge
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#fca5a5', lineHeight: 1.5, margin: '0 0 10px 0', fontWeight: 700 }}>
            {disqualifiedReason}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
            You reached the maximum limit of 3 infractions (3/3). You have been removed from the active sprint to preserve exam integrity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDisqualifiedReason(null);
            if (proctorWarningsRef) proctorWarningsRef.current = 0;
            if (lastInfractionTimeRef) lastInfractionTimeRef.current = 0;
            setProctorWarnings(0);
          }}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem', fontWeight: 800, marginTop: '0.5rem' }}
        >
          Return to Study Room
        </button>
      </div>
    </div>
  );
}
