'use client';

import { ArrowLeft } from 'lucide-react';

export default function FocusHeader({
  sessionsCompletedToday,
  totalFocusMinutesToday,
  onBackClick
}) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      margin: '0 0 0.5rem 0',
      padding: '0 0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      zIndex: 10,
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onBackClick}
          className="icon-btn"
          title="Exit Focus Mode"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#f4f4f6',
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            margin: 0,
            lineHeight: 1.15
          }}>
            Focus Timer
          </h1>
          <p style={{
            fontSize: '0.92rem',
            color: '#9ca3af',
            margin: '3px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Today: <strong style={{ color: '#ffffff', fontWeight: 700 }}>{sessionsCompletedToday}</strong> sessions
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{totalFocusMinutesToday} mins focused</span>
          </p>
        </div>
      </div>
    </div>
  );
}
