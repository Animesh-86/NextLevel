'use client';
import { X, ShieldCheck, VideoOff, Mic, ArrowRight, RefreshCw, Volume2 } from 'lucide-react';

export default function PreflightCheckModal({
  isOpen,
  onClose,
  preflightVideoRef,
  setPreflightVideoRef,
  camPermissionGranted,
  micPermissionGranted,
  faceDetectedInFrame,
  micAudioLevel,
  onConfirmAndStart,
  onRetryPermissions,
  onBypassCamera,
}) {
  if (!isOpen) return null;

  const canEnter = (camPermissionGranted || micPermissionGranted);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '16px',
          background: '#101014',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          padding: '1.75rem',
          color: '#f4f4f6',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#a1a1ad',
            cursor: 'pointer'
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent, #f5a623)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
            <ShieldCheck size={14} /> Pre-Interview Calibration
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
            Camera & Audio Verification
          </h2>
          <p style={{ color: '#a1a1ad', fontSize: '0.84rem', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
            Verify that your microphone picks up your voice and camera is ready. You will enter a full-screen proctored session with live AI dialogue.
          </p>
        </div>

        {/* Video Mirror Tile */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#08080a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <video
            ref={setPreflightVideoRef || preflightVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: camPermissionGranted ? 'block' : 'none'
            }}
          />

          {!camPermissionGranted && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <VideoOff size={36} style={{ color: '#f87171', margin: '0 auto 0.6rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Camera Not Connected / Needs Permission</div>
              <div style={{ fontSize: '0.78rem', color: '#a1a1ad', marginTop: '4px', maxWidth: '340px' }}>
                Allow camera in your browser address bar, or practice in audio-only mode.
              </div>
            </div>
          )}

          {camPermissionGranted && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: faceDetectedInFrame ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 166, 35, 0.2)',
                color: faceDetectedInFrame ? '#34d399' : '#f5a623',
                border: `1px solid ${faceDetectedInFrame ? 'rgba(52, 211, 153, 0.4)' : 'rgba(245, 166, 35, 0.4)'}`
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: faceDetectedInFrame ? '#34d399' : '#f5a623' }} />
              {faceDetectedInFrame ? '✓ Candidate In Frame' : '• Camera Ready (Centering Face...)'}
            </div>
          )}
        </div>

        {/* Hardware Status List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {/* Mic Level Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.95rem', borderRadius: '8px', background: '#08080a', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>
              <Mic size={15} style={{ color: micPermissionGranted ? '#34d399' : '#f87171' }} />
              <span>Microphone: {micPermissionGranted ? 'Connected' : 'Waiting for access'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${micAudioLevel}%`, height: '100%', background: '#34d399', transition: 'width 0.1s ease' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#a1a1ad', width: '28px' }}>{micAudioLevel}%</span>
            </div>
          </div>

          {/* Fallback actions if permissions not granted */}
          {(!camPermissionGranted || !micPermissionGranted) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {onRetryPermissions && (
                <button
                  type="button"
                  onClick={onRetryPermissions}
                  style={{
                    flex: '1 1 180px',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f4f4f6',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={13} /> Retry Permissions
                </button>
              )}
              {!camPermissionGranted && onBypassCamera && (
                <button
                  type="button"
                  onClick={onBypassCamera}
                  style={{
                    flex: '1 1 180px',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 166, 35, 0.1)',
                    border: '1px solid rgba(245, 166, 35, 0.3)',
                    color: '#f5a623',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Volume2 size={13} /> Continue Audio-Only
                </button>
              )}
            </div>
          )}

          {/* Proctor Notice */}
          <div style={{ fontSize: '0.76rem', color: '#a1a1ad', lineHeight: 1.4, padding: '0 0.25rem' }}>
            • When you enter, the interview will lock into <strong>Full Screen Mode</strong>.<br />
            • <strong>3 warnings</strong> are allotted for tab switches or leaving camera frame before auto-submission.
          </div>
        </div>

        {/* Proceed CTA */}
        <button
          onClick={onConfirmAndStart}
          disabled={!canEnter}
          style={{
            width: '100%',
            padding: '0.9rem',
            borderRadius: '10px',
            background: canEnter ? '#fafafa' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: canEnter ? '#09090b' : '#71717a',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: canEnter ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: canEnter ? '0 4px 18px rgba(255, 255, 255, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {camPermissionGranted
            ? 'Enter Proctored Room (Full Screen)'
            : 'Enter Proctored Room (Audio Mode)'} <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
