'use client';

import { ArrowLeft, Maximize, ShieldAlert, VolumeX, Volume2, Clock, Award } from 'lucide-react';

export default function InterviewHUDBar({
  session,
  onRequestExit,
  requestFullScreenMode,
  isFullscreen,
  proctorWarnings,
  isAudioMuted,
  onToggleAudioMuted,
  isTimeCritical,
  formatTime,
  timeLeft,
  onConclude
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        background: 'var(--surface-1, #101014)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onRequestExit}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #a1a1ad)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem'
          }}
          title="Exit interview"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text, #f4f4f6)' }}>
              {session?.role}
            </span>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted, #a1a1ad)', fontWeight: 600 }}>
              {session?.experienceLevel}
            </span>
          </div>
          {session?.resumeTitle && session.resumeTitle !== 'Not provided' && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #a1a1ad)', marginTop: '2px' }}>
              Grounding Resume: <strong style={{ color: '#e4e4e7' }}>{session.resumeTitle}</strong>
            </div>
          )}
        </div>
      </div>

      {/* HUD Controls: Proctoring Warnings, Full Screen, Mute, Timer, Conclude */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {/* Full Screen Mode Button */}
        <button
          onClick={requestFullScreenMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: isFullscreen ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 166, 35, 0.15)',
            border: `1px solid ${isFullscreen ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 166, 35, 0.4)'}`,
            color: isFullscreen ? '#34d399' : '#f5a623',
            cursor: 'pointer'
          }}
          title={isFullscreen ? 'In Full Screen mode' : 'Lock Full Screen mode'}
        >
          <Maximize size={13} />
          <span>{isFullscreen ? 'Full Screen' : 'Lock Full Screen'}</span>
        </button>

        {/* Proctoring Warnings Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: proctorWarnings === 0
              ? 'rgba(52, 211, 153, 0.08)'
              : proctorWarnings === 1
              ? 'rgba(245, 166, 35, 0.12)'
              : 'rgba(248, 113, 113, 0.15)',
            border: `1px solid ${
              proctorWarnings === 0
                ? 'rgba(52, 211, 153, 0.25)'
                : proctorWarnings === 1
                ? 'rgba(245, 166, 35, 0.35)'
                : 'rgba(248, 113, 113, 0.45)'
            }`,
            color: proctorWarnings === 0 ? '#34d399' : proctorWarnings === 1 ? '#f5a623' : '#f87171'
          }}
        >
          <ShieldAlert size={13} />
          <span>Warnings: {proctorWarnings} / 3</span>
        </div>

        {/* AI Audio Mute Toggle */}
        <button
          onClick={onToggleAudioMuted}
          style={{
            padding: '0.38rem 0.5rem',
            borderRadius: '6px',
            background: isAudioMuted ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: isAudioMuted ? 'var(--danger, #f87171)' : 'var(--text, #f4f4f6)',
            cursor: 'pointer'
          }}
          title={isAudioMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
        >
          {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Session Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            background: isTimeCritical ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${isTimeCritical ? '#f87171' : 'rgba(255, 255, 255, 0.08)'}`,
            color: isTimeCritical ? '#f87171' : '#f4f4f6',
            fontWeight: 700,
            fontSize: '0.82rem'
          }}
        >
          <Clock size={14} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Conclude Round CTA */}
        <button
          onClick={onConclude}
          style={{
            padding: '0.45rem 0.95rem',
            borderRadius: '8px',
            background: '#fafafa',
            border: 'none',
            color: '#09090b',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
          }}
        >
          <Award size={14} /> Conclude Round
        </button>
      </div>
    </div>
  );
}
