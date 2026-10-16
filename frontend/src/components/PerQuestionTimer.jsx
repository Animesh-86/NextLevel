'use client';

import React from 'react';

/**
 * Animated Radial SVG Timer for Per-Question Timed OA Assessments
 */
export default function PerQuestionTimer({
  timeLeft = 60,
  totalDuration = 60,
  size = 96,
  strokeWidth = 7,
  compact = false
}) {
  const safeTotal = Math.max(1, totalDuration);
  const safeTime = Math.max(0, Math.min(timeLeft, safeTotal));
  const percent = (safeTime / safeTotal) * 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const isCritical = safeTime <= 10;
  const isWarning = safeTime <= 25 && safeTime > 10;

  const strokeColor = isCritical
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : '#10b981';

  const glowColor = isCritical
    ? 'rgba(239, 68, 68, 0.45)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.35)'
    : 'rgba(16, 185, 129, 0.35)';

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
          padding: '4px 10px 4px 6px',
          borderRadius: '24px',
          transition: 'all 0.3s ease',
        }}
        className={isCritical ? 'pulse-urgent-timer' : ''}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 3px ${glowColor})`
            }}
          />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            fontWeight: 800,
            color: strokeColor,
            lineHeight: 1
          }}>
            {safeTime}s
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Q-Timer
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={isCritical ? 'pulse-urgent-timer' : ''}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${glowColor})`
          }}
        />
      </svg>

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            fontSize: size > 80 ? '1.85rem' : '1.25rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: strokeColor,
            letterSpacing: '-0.04em',
            lineHeight: 1
          }}
        >
          {safeTime}s
        </div>
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '3px'
          }}
        >
          {isCritical ? 'HURRY' : 'QUESTION'}
        </div>
      </div>
    </div>
  );
}
