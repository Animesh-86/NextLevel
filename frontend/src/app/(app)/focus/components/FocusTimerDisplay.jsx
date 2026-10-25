'use client';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function FocusTimerDisplay({
  mode,
  customMinutes,
  handleModeChange,
  timeLeft,
  duration,
  isRunning
}) {
  const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const radius = 110;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      {/* Mode Presets */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '3px',
        borderRadius: '30px',
        gap: '4px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { m: 'focus', mins: 25, label: 'Focus (25m)' },
          { m: 'shortBreak', mins: 5, label: 'Short Break (5m)' },
          { m: 'longBreak', mins: 15, label: 'Long Break (15m)' },
          { m: 'custom', mins: customMinutes, label: 'Custom' }
        ].map(({ m, mins, label }) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m, mins)}
            style={{
              border: 'none',
              padding: '6px 16px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              borderRadius: '20px',
              background: mode === m ? '#ffffff' : 'transparent',
              color: mode === m ? '#000000' : '#a1a1ad',
              fontWeight: mode === m ? 700 : 500,
              transition: 'all 0.2s ease'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dual Info Callouts: Fullscreen & Practice Section Notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: '680px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.22)',
          borderRadius: '20px',
          fontSize: '0.74rem',
          color: '#a7f3d0'
        }}>
          <span style={{ color: '#34d399', fontWeight: 700 }}>✦ Fullscreen:</span>
          <span>Automatically enters full screen mode when started</span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.24)',
          borderRadius: '20px',
          fontSize: '0.74rem',
          color: '#fde68a'
        }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠ Practice Notice:</span>
          <span>Timer ends automatically if you move to Practice section</span>
        </div>
      </div>

      {/* Circular Immersive Clock (260px diameter) */}
      <div style={{
        position: 'relative',
        width: '260px',
        height: '260px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Breathing ambient glow */}
        <div style={{
          position: 'absolute',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: isRunning ? (mode.includes('Break') ? '#f59e0b' : '#34d399') : 'transparent',
          opacity: 0.08,
          filter: 'blur(35px)',
          transition: 'all 0.5s ease',
          animation: isRunning ? 'pulse 3s infinite ease-in-out' : 'none'
        }} />

        <svg width="260" height="260" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke={mode.includes('Break') ? '#f5a623' : '#34d399'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>

        {/* Time digits */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1
        }}>
          <span style={{
            fontSize: '3.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{
            fontSize: '0.72rem',
            color: '#a1a1ad',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginTop: '8px',
            fontWeight: 600
          }}>
            {mode === 'focus' ? 'Focus Session' : mode.includes('Break') ? 'Zen Break' : 'Custom Session'}
          </span>
        </div>
      </div>
    </>
  );
}
