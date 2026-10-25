'use client';

import React from 'react';
import {
  X,
  Trophy,
  Download,
  Zap,
  Flame,
  ShieldAlert,
  Users2
} from 'lucide-react';

export function RoomSprintResultModal({
  viewingPastChallenge,
  setViewingPastChallenge,
  currentUserId,
  handleDownloadResultImage
}) {
  if (!viewingPastChallenge) return null;

  const modeLabel =
    viewingPastChallenge.gameMode === 'BOSS'
      ? 'Co-op Boss'
      : viewingPastChallenge.gameMode === 'SURVIVAL'
      ? 'Survival'
      : viewingPastChallenge.gameMode === 'TEAMS'
      ? 'Squad'
      : 'OA Blitz';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setViewingPastChallenge(null);
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '92%',
          maxWidth: '640px',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '1.75rem',
          borderRadius: '16px',
          animation: 'fadeIn 0.2s ease-out',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trophy size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {viewingPastChallenge.title}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {modeLabel} · {viewingPastChallenge.questionCount || 10} Questions ·{' '}
                {viewingPastChallenge.perQuestionSeconds || 30}s/Q
              </div>
            </div>
          </div>
          <button onClick={() => setViewingPastChallenge(null)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mode</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{modeLabel}</div>
          </div>
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Questions</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {viewingPastChallenge.questionCount || 10} Qs • {viewingPastChallenge.perQuestionSeconds || 30}s
            </div>
          </div>
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed By</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {(viewingPastChallenge.leaderboard || []).length} Participants
            </div>
          </div>
        </div>

        {/* Standings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Final Standings & Leaderboard
          </div>
          {!viewingPastChallenge.leaderboard || viewingPastChallenge.leaderboard.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              No participants completed this challenge.
            </div>
          ) : (
            viewingPastChallenge.leaderboard.map((player, pIdx) => {
              const isMe = player.userId === currentUserId;
              return (
                <div
                  key={pIdx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: isMe ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface)',
                    border: isMe ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem', minWidth: '28px' }}>
                      {pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : `#${pIdx + 1}`}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                        {player.userName} {isMe && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {player.correctCount != null
                          ? `${player.correctCount}/${viewingPastChallenge.questionCount || 10} correct`
                          : 'Completed'}{' '}
                        {player.avgSpeedSeconds ? `• ${player.avgSpeedSeconds}s / Q avg` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#f59e0b' }}>
                      {player.score || 0} pts
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons: Save as Image + Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => handleDownloadResultImage(viewingPastChallenge)}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          >
            <Download size={15} /> Save as Image
          </button>
          <button
            type="button"
            onClick={() => setViewingPastChallenge(null)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.4rem', fontWeight: 800 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoomModesInfoModal({ showGameInfoModal, setShowGameInfoModal }) {
  if (!showGameInfoModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setShowGameInfoModal(false);
      }}
    >
      <div className="glass-panel" style={{ width: '92%', maxWidth: '520px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Multiplayer Arena Modes</h3>
          <button onClick={() => setShowGameInfoModal(false)} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
          <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={15} style={{ color: 'var(--brand-primary)' }} /> OA Blitz (Standard)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Simulates standard company OA pressure. Every player sees the same question on a 30s-60s strict countdown. Speed bonuses award up to +100 bonus points for rapid accuracy.
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={15} style={{ color: '#f87171' }} /> Co-op Boss Battle
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Collaborate against a legendary monster (e.g. Algorithmic Dragon). Every correct answer dealt by any peer in the room deals direct damage to the boss HP bar.
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} style={{ color: '#f59e0b' }} /> Survival Mode
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sudden-death elimination. Answer incorrectly or run out of time and you are moved to spectator mode. The last remaining survivor takes the crown!
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#60a5fa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users2 size={15} style={{ color: '#60a5fa' }} /> Squad Battle
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Participants are automatically partitioned into Red and Blue squads. Team aggregate scores compete for podium glory.
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button onClick={() => setShowGameInfoModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
