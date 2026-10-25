'use client';

import React from 'react';
import { Crown } from 'lucide-react';

export default function RoomPeopleList({
  myGoal,
  setGoalInput,
  setShowGoalModal,
  participantsList = [],
  currentUserId,
  room,
  stageState,
  pomodoroRunning,
  pomodoroPhase,
  isHost,
  handleTransferHost,
  handleKickUser
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        overflowY: 'auto',
        minHeight: 0,
        paddingRight: '2px'
      }}
    >
      {/* Current User Goal Banner */}
      <div
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}
          >
            Your Session Goal
          </span>
          <button
            type="button"
            onClick={() => {
              setGoalInput(myGoal);
              setShowGoalModal(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {myGoal ? 'Edit' : '+ Set Goal'}
          </button>
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            color: myGoal ? 'var(--text-primary)' : 'var(--text-muted)',
            fontStyle: myGoal ? 'normal' : 'italic'
          }}
        >
          {myGoal ? `🎯 "${myGoal}"` : 'No goal set yet. Set a goal so your peers know what you are studying!'}
        </div>
      </div>

      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: '4px'
        }}
      >
        Peers in Room ({participantsList.length})
      </div>

      {/* List of Connected Peers */}
      {participantsList.map((p, idx) => {
        const isMe = p.userId === currentUserId;
        const isPeerHost = p.userId === room?.hostUserId;

        let statusLabel = '🟢 Online';
        let statusColor = '#10b981';
        if (stageState === 'live_question' || stageState === 'checkpoint') {
          statusLabel = '⚔️ In Arena';
          statusColor = '#ef4444';
        } else if (pomodoroRunning && pomodoroPhase === 'WORK') {
          statusLabel = '🎯 Focusing';
          statusColor = '#3b82f6';
        } else if (pomodoroRunning && pomodoroPhase === 'BREAK') {
          statusLabel = '☕ Break';
          statusColor = '#10b981';
        }

        return (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: isMe ? 'rgba(255, 255, 255, 0.07)' : 'var(--bg-surface)',
              border: isMe ? '1px solid var(--border-strong)' : '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isMe ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.12)',
                    color: isMe ? 'var(--brand-inverse)' : 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {p.userName ? p.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{p.userName}</span>
                    {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(You)</span>}
                    {isPeerHost && <Crown size={12} style={{ color: '#f59e0b' }} />}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: statusColor
                }}
              >
                {statusLabel}
              </span>
            </div>

            {/* Peer Session Goal */}
            <div
              style={{
                fontSize: '0.76rem',
                color: p.goal ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontStyle: p.goal ? 'italic' : 'normal',
                background: 'rgba(0, 0, 0, 0.15)',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: 1.3
              }}
            >
              {p.goal ? `🎯 "${p.goal}"` : 'No goal set'}
            </div>

            {/* Host Moderation for other peers */}
            {isHost && !isMe && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => handleTransferHost(p.userId)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
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
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                  title="Remove peer from room"
                >
                  Kick
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
