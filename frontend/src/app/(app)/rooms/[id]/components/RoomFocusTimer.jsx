'use client';

import {
  Minimize2,
  Maximize2,
  RotateCcw,
  Play,
  Pause,
  Headphones,
} from 'lucide-react';

export default function RoomFocusTimer({
  isTimerExpanded,
  setIsTimerExpanded,
  timerMode,
  setTimerMode,
  showCustomFocusInput,
  setShowCustomFocusInput,
  customFocusInput,
  setCustomFocusInput,
  pomodoroDurationMinutes,
  setPomodoroDurationMinutes,
  pomodoroSeconds,
  setPomodoroSeconds,
  pomodoroRunning,
  setPomodoroRunning,
  pomodoroPhase,
  setPomodoroPhase,
  soundPlaying,
  activeSound,
  handleSelectSound,
  showAudioPopover,
  setShowAudioPopover,
  toast
}) {
  const timerTabs = [
    { id: 'FOCUS', label: 'Focus (25m)', mins: 25, phase: 'WORK' },
    { id: 'SHORT_BREAK', label: 'Short Break (5m)', mins: 5, phase: 'BREAK' },
    { id: 'LONG_BREAK', label: 'Long Break (15m)', mins: 15, phase: 'BREAK' },
    { id: 'CUSTOM', label: 'Custom', mins: parseInt(customFocusInput, 10) || 50, phase: 'WORK' },
  ];

  const audioPresets = [
    { id: 'none', label: 'Muted (Off)' },
    { id: 'lofi', label: 'Lo-Fi Beats' },
    { id: 'brown_noise', label: 'Ocean Waves' },
    { id: 'rain', label: 'Gentle Rain' },
    { id: 'cafe', label: 'Cozy Cafe' },
  ];

  const circleSize = isTimerExpanded ? 280 : 185;
  const radius = isTimerExpanded ? 122 : 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, pomodoroSeconds / (pomodoroDurationMinutes * 60 || 1500)));
  const offset = circumference * (1 - progress);

  const minsLeft = Math.floor(pomodoroSeconds / 60);
  const secsLeft = pomodoroSeconds % 60;
  const timeDisplay = `${minsLeft.toString().padStart(2, '0')}:${secsLeft.toString().padStart(2, '0')}`;

  return (
    <div className="card glass-panel" style={{
      flex: isTimerExpanded ? '1 1 100%' : '1.1 1 0',
      width: '100%',
      height: '100%',
      padding: isTimerExpanded ? '1.5rem 2rem' : '1.15rem 1.35rem',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-light)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      overflow: 'visible',
      transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease'
    }}>
      {/* Top Segmented Pill Switcher with Fullscreen Toggle near Custom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '26px',
          padding: '3px 4px',
          gap: '3px',
          maxWidth: '100%',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {timerTabs.map(tab => {
            const isActive = timerMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTimerMode(tab.id);
                  if (tab.id === 'CUSTOM') {
                    setShowCustomFocusInput(true);
                  } else {
                    setShowCustomFocusInput(false);
                    setPomodoroDurationMinutes(tab.mins);
                    setPomodoroSeconds(tab.mins * 60);
                    setPomodoroRunning(false);
                    setPomodoroPhase(tab.phase);
                  }
                }}
                style={{
                  padding: '5px 13px',
                  borderRadius: '18px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />
          <button
            type="button"
            onClick={() => setIsTimerExpanded(prev => !prev)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isTimerExpanded ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              border: isTimerExpanded ? '1px solid #10b981' : 'none',
              color: isTimerExpanded ? '#10b981' : 'rgba(255, 255, 255, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            title={isTimerExpanded ? "Restore Game Arena and Recent Sprints" : "Full screen focus timer (minimize arena & sprints)"}
          >
            {isTimerExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Inline Custom Minutes Config */}
      {showCustomFocusInput && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          margin: '4px 0',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Focus duration:</span>
          <input
            type="number"
            min="1"
            max="180"
            value={customFocusInput}
            onChange={(e) => setCustomFocusInput(e.target.value)}
            style={{
              width: '46px',
              padding: '3px 6px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-light)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 700,
              textAlign: 'center',
              outline: 'none'
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>mins</span>
          <button
            type="button"
            onClick={() => {
              const mins = Math.max(1, Math.min(180, parseInt(customFocusInput, 10) || 25));
              setPomodoroDurationMinutes(mins);
              setPomodoroSeconds(mins * 60);
              setPomodoroRunning(false);
              setPomodoroPhase('WORK');
              if (toast) toast.success(`Custom focus interval set to ${mins} minutes!`);
            }}
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.78rem', fontWeight: 800 }}
          >
            Set
          </button>
        </div>
      )}

      {/* Middle Area: Centered Timer Circle */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '0.35rem 0'
      }}>
        <div style={{
          position: 'relative',
          width: `${circleSize}px`,
          height: `${circleSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            <circle
              cx={circleSize / 2} cy={circleSize / 2} r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="7"
            />
            <circle
              cx={circleSize / 2} cy={circleSize / 2} r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div style={{
            position: 'absolute',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: isTimerExpanded ? '3.8rem' : '2.5rem',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1
            }}>
              {timeDisplay}
            </div>
            <div style={{
              fontSize: isTimerExpanded ? '0.85rem' : '0.68rem',
              fontWeight: 800,
              color: '#10b981',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '6px'
            }}>
              {timerMode === 'SHORT_BREAK' ? 'SHORT BREAK' : timerMode === 'LONG_BREAK' ? 'LONG BREAK' : 'FOCUS SESSION'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Row: Reset, Start Focus Pill, Ambient Audio Popover */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'relative',
        marginTop: 'auto',
        paddingTop: '0.4rem',
        width: '100%'
      }}>
        <button
          type="button"
          onClick={() => {
            setPomodoroRunning(false);
            setPomodoroSeconds(pomodoroDurationMinutes * 60);
            if (toast) toast.info('Timer reset');
          }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Reset timer"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setPomodoroRunning(prev => {
              const next = !prev;
              if (toast) {
                if (next) toast.info(pomodoroPhase === 'WORK' ? 'Focus timer started! 🎯' : 'Break timer started! ☕');
                else toast.info('Focus timer paused ⏸️');
              }
              return next;
            });
          }}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '19px',
            background: '#ffffff',
            color: '#000000',
            fontWeight: 800,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 16px rgba(255, 255, 255, 0.25)',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease'
          }}
        >
          {pomodoroRunning ? <Pause size={14} fill="#000000" /> : <Play size={14} fill="#000000" />}
          <span>{pomodoroRunning ? 'Pause Focus' : 'Start Focus'}</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowAudioPopover(prev => !prev)}
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '18px',
              background: soundPlaying ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: soundPlaying ? '1px solid #10b981' : '1px solid var(--border-light)',
              color: soundPlaying ? '#10b981' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Ambient Focus Sounds"
          >
            <Headphones size={14} style={{ color: soundPlaying ? '#10b981' : 'currentColor' }} />
            <span style={{ textTransform: 'capitalize' }}>
              {activeSound !== 'none' && soundPlaying ? activeSound.replace('_', ' ') : 'Audio'}
            </span>
            <span style={{ fontSize: '0.65rem' }}>▾</span>
          </button>

          {showAudioPopover && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '125%',
                zIndex: 300,
                width: '180px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#111827',
                borderRadius: '12px',
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                Ambient Focus Audio
              </div>
              {audioPresets.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSound(item.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: activeSound === item.id ? 700 : 500,
                    border: 'none',
                    background: activeSound === item.id ? '#ffffff' : 'transparent',
                    color: activeSound === item.id ? '#000000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
