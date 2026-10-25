'use client';

import React from 'react';
import {
  MessageSquare,
  Users,
  ChevronRight,
  Swords,
  Lock,
  Clock,
  Crown,
  Send
} from 'lucide-react';
import RoomPeopleList from './RoomPeopleList';

export default function RoomChatFeed({
  rightRailTab,
  setRightRailTab,
  stageState,
  setChatCollapsedManually,
  chatBottomRef,
  messages = [],
  room,
  isChallengeActive,
  lobbyCountdown,
  handleStartChallenge,
  setIsFullscreenActive,
  currentUserId,
  chatInput,
  setChatInput,
  handleSendMessage,
  sendingMsg,
  myGoal,
  setGoalInput,
  setShowGoalModal,
  participantsList = [],
  pomodoroRunning,
  pomodoroPhase,
  isHost,
  handleTransferHost,
  handleKickUser
}) {
  return (
    <div
      className="card"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: stageState === 'live_question' ? 'auto' : '100%',
        minHeight: 0,
        padding: stageState === 'live_question' ? '0.85rem 1rem' : '1.1rem 1.25rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Segment Switcher: [Chat] | [People ({participantsList.length})] */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '0.95rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '3px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}
        >
          <button
            type="button"
            onClick={() => setRightRailTab('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: rightRailTab === 'chat' ? 800 : 600,
              background: rightRailTab === 'chat' ? 'var(--brand-primary)' : 'transparent',
              color: rightRailTab === 'chat' ? 'var(--brand-inverse)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setRightRailTab('people')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: rightRailTab === 'people' ? 800 : 600,
              background: rightRailTab === 'people' ? 'var(--brand-primary)' : 'transparent',
              color: rightRailTab === 'people' ? 'var(--brand-inverse)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={13} />
            <span>People ({participantsList.length})</span>
          </button>
        </div>

        {stageState === 'live_question' && (
          <button
            type="button"
            onClick={() => setChatCollapsedManually(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
            title="Collapse rail for focus"
          >
            <span>Collapse</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* ─── TAB CONTENT 1: CHAT ─── */}
      {rightRailTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Messages Feed */}
          <div
            ref={chatBottomRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              paddingRight: '4px'
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  marginTop: '3rem'
                }}
              >
                No messages yet. Say hi to your peers or launch a challenge! 👋
              </div>
            ) : (
              messages.map((msg, i) => {
                if (msg.type === 'SYSTEM') {
                  return (
                    <div
                      key={i}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        padding: '4px 8px',
                        fontStyle: 'italic',
                        lineHeight: 1.4
                      }}
                    >
                      {msg.content}
                    </div>
                  );
                }

                if (msg.type === 'CHALLENGE_INVITE') {
                  const chId = msg.metadata?.challengeId;
                  const isThisChallenge = !chId || room?.activeChallenge?.id === chId;
                  const chStatus = room?.activeChallenge?.status;
                  const isChallengeActiveNow = isChallengeActive || stageState === 'live_question' || stageState === 'checkpoint';
                  const isStarted = isThisChallenge && (chStatus === 'IN_PROGRESS' || isChallengeActiveNow);
                  const isLobby = isThisChallenge && !isStarted && (chStatus === 'INVITING' || stageState === 'invite_open');
                  const isStillActive = (isLobby || isStarted) && chStatus !== 'COMPLETED' && chStatus !== 'CANCELLED';

                  const pastCh = (room?.pastChallenges || []).find(
                    c => c.id === chId || (msg.content && msg.content.includes(c.title))
                  );
                  const wasCancelled =
                    pastCh?.status === 'CANCELLED' ||
                    (msg.content && msg.content.toLowerCase().includes('cancel')) ||
                    messages.some(
                      m =>
                        m.type === 'SYSTEM' &&
                        m.content &&
                        m.content.toLowerCase().includes('cancelled') &&
                        (pastCh ? m.content.includes(pastCh.title) : true)
                    );

                  return (
                    <div
                      key={i}
                      style={{
                        background: isStillActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isStillActive ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        opacity: isStillActive ? 1 : 0.7
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Swords size={15} />
                          <span>OA Blitz Challenge Ready</span>
                        </div>
                        {isStarted ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: '#f87171',
                              fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.15)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            In Progress
                          </span>
                        ) : !isStillActive ? (
                          wasCancelled ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: '#f87171',
                                fontWeight: 800,
                                background: 'rgba(239, 68, 68, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              Cancelled
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Concluded
                            </span>
                          )
                        ) : null}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {msg.content}
                      </div>
                      {isStarted ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: '#f87171',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            marginTop: '4px'
                          }}
                        >
                          <Lock size={13} />
                          <span>Sprint in progress • Lobby closed</span>
                        </div>
                      ) : isLobby ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          {lobbyCountdown !== null && lobbyCountdown > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#f59e0b',
                                fontSize: '0.74rem',
                                fontWeight: 800
                              }}
                            >
                              <Clock size={12} />
                              <span>Auto-starts in {lobbyCountdown}s...</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof document !== 'undefined' &&
                                document.documentElement?.requestFullscreen &&
                                !document.fullscreenElement
                              ) {
                                document.documentElement
                                  .requestFullscreen()
                                  .then(() => setIsFullscreenActive(true))
                                  .catch(() => {});
                              }
                              handleStartChallenge(room?.activeChallenge);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem', fontSize: '0.8rem', fontWeight: 800 }}
                          >
                            Join Challenge {lobbyCountdown !== null && lobbyCountdown > 0 ? `(${lobbyCountdown}s)` : ''}
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: wasCancelled ? '#f87171' : 'var(--text-muted)',
                            fontStyle: 'italic',
                            marginTop: '2px'
                          }}
                        >
                          {wasCancelled ? 'Sprint Cancelled ✖' : 'Sprint Concluded 🏁'}
                        </div>
                      )}
                    </div>
                  );
                }

                const isMe = msg.userId === currentUserId;
                const isMsgHost = msg.userId === room?.hostUserId;

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {isMe ? 'You' : msg.userName}
                      {isMsgHost && <Crown size={11} style={{ color: '#f59e0b' }} />}
                    </span>
                    <div
                      style={{
                        background: isMe ? 'var(--brand-primary)' : 'var(--bg-surface)',
                        color: isMe ? 'var(--brand-inverse)' : 'var(--text-primary)',
                        padding: '0.55rem 0.85rem',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        maxWidth: '85%',
                        wordBreak: 'break-word',
                        border: isMe ? 'none' : '1px solid var(--border-light)'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Reactions Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 0',
              borderTop: '1px solid var(--border-light)',
              marginTop: '0.5rem'
            }}
          >
            {['👏', '🔥', '💡', '🎉', '☕', '💪'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setChatInput(prev => (prev ? `${prev} ${emoji}` : emoji));
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                title={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Message room..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || sendingMsg}
              className="btn btn-primary"
              style={{ padding: '0.55rem 0.85rem' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB CONTENT 2: PEOPLE (PEERS & SESSION GOALS) ─── */}
      {rightRailTab === 'people' && (
        <RoomPeopleList
          myGoal={myGoal}
          setGoalInput={setGoalInput}
          setShowGoalModal={setShowGoalModal}
          participantsList={participantsList}
          currentUserId={currentUserId}
          room={room}
          stageState={stageState}
          pomodoroRunning={pomodoroRunning}
          pomodoroPhase={pomodoroPhase}
          isHost={isHost}
          handleTransferHost={handleTransferHost}
          handleKickUser={handleKickUser}
        />
      )}
    </div>
  );
}
