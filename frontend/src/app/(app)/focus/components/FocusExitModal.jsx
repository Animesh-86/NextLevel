'use client';

import { createPortal } from 'react-dom';
import { HUMOROUS_EXIT_QUOTES } from '@/lib/FocusContext';

export default function FocusExitModal({
  mounted,
  showExitModal,
  exitQuoteIndex,
  cancelExit,
  confirmExit
}) {
  if (!mounted || !showExitModal) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(16px)',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '1.25rem',
        boxSizing: 'border-box'
      }}
      onClick={cancelExit}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 45px rgba(52, 211, 153, 0.22)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '24px',
          background: '#0d0d14',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {HUMOROUS_EXIT_QUOTES[exitQuoteIndex]?.title || 'Leaving so soon, Space Cadet?'}
          </h2>
          <p style={{ color: '#d1d5db', fontSize: '0.94rem', lineHeight: '1.55', margin: 0 }}>
            {HUMOROUS_EXIT_QUOTES[exitQuoteIndex]?.msg || "Don't break your momentum. Stay and finish strong."}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: '10px',
          marginTop: '8px'
        }}>
          <button
            type="button"
            onClick={cancelExit}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#34d399',
              color: '#000000',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(52, 211, 153, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            Stay and Finish
          </button>

          <button
            type="button"
            onClick={() => confirmExit('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '12px',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Surrender and Exit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
