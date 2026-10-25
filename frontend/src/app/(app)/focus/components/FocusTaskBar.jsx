'use client';

import { ChevronDown, Plus, CheckCircle2, Circle, X, Sparkles, EyeOff, Gauge } from 'lucide-react';
import { PARTICLE_SPEEDS } from '@/lib/FocusContext';

export default function FocusTaskBar({
  soundType,
  setSoundType,
  tasks,
  selectedTaskId,
  setSelectedTaskId,
  isAddingTask,
  setIsAddingTask,
  newTaskTitle,
  setNewTaskTitle,
  isCreatingTask,
  handleCreateQuickTask,
  handleToggleTaskStatus,
  mode,
  customMinutes,
  setCustomMinutes,
  handleModeChange,
  volume,
  setVolume,
  particlesEnabled,
  setParticlesEnabled,
  particleSpeedIndex,
  setParticleSpeedIndex
}) {
  const linkedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div style={{
      width: '100%',
      padding: '1.25rem 1.5rem',
      background: 'rgba(255, 255, 255, 0.035)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Ambient Sound */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Ambient Sound
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                fontSize: '0.84rem',
                background: '#121217',
                color: '#f4f4f6',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                padding: '0 34px 0 12px',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="none">Silence (No Sound)</option>
              <option value="rain">Relaxing Rain</option>
              <option value="noise">White Noise</option>
              <option value="beats">Binaural Beats</option>
              <option value="ticking">Metronome</option>
            </select>
            <ChevronDown
              size={15}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            />
          </div>
        </div>

        {/* Linked Task with Quick Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Linked Task
            </label>
            <button
              type="button"
              onClick={() => setIsAddingTask(!isAddingTask)}
              style={{
                background: 'none',
                border: 'none',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: 0
              }}
            >
              <Plus size={12} /> {isAddingTask ? 'Cancel' : 'Quick Add'}
            </button>
          </div>

          {isAddingTask ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="New task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateQuickTask();
                }}
                style={{
                  flex: 1,
                  height: '38px',
                  padding: '0 12px',
                  background: '#121217',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateQuickTask}
                disabled={isCreatingTask || !newTaskTitle.trim()}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  background: '#34d399',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  opacity: !newTaskTitle.trim() ? 0.5 : 1
                }}
              >
                {isCreatingTask ? '...' : 'Add'}
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  fontSize: '0.84rem',
                  background: '#121217',
                  color: '#f4f4f6',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  padding: '0 34px 0 12px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">None (General Focus)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.status === 'done' ? '✓ ' : ''}{t.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Linked Task Active Status Pill */}
      {linkedTask && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.22)',
          borderRadius: '8px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => handleToggleTaskStatus(linkedTask.id, linkedTask.status === 'done' ? 'todo' : 'done')}
              style={{
                background: 'none',
                border: 'none',
                color: linkedTask.status === 'done' ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
              title={linkedTask.status === 'done' ? 'Mark as Incomplete' : 'Mark as Done'}
            >
              {linkedTask.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>
            <span style={{
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: linkedTask.status === 'done' ? 'line-through' : 'none',
              opacity: linkedTask.status === 'done' ? 0.7 : 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {linkedTask.title}
            </span>
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: linkedTask.status === 'done' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: linkedTask.status === 'done' ? '#34d399' : '#f59e0b',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {linkedTask.status === 'done' ? 'DONE' : 'IN PROGRESS'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTaskId('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8px'
            }}
            title="Unlink task"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Slider for volume or custom duration */}
      {mode === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ fontSize: '0.74rem', color: '#a1a1ad' }}>Minutes:</span>
          <input
            type="range"
            min="1"
            max="120"
            value={customMinutes}
            onChange={(e) => {
              const mins = parseInt(e.target.value);
              setCustomMinutes(mins);
              handleModeChange('custom', mins);
            }}
            style={{ flex: 1, accentColor: '#34d399' }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', width: '34px', textAlign: 'right' }}>{customMinutes}m</span>
        </div>
      )}

      {soundType !== 'none' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ fontSize: '0.74rem', color: '#a1a1ad' }}>Volume:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: '#34d399' }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', width: '34px', textAlign: 'right' }}>{volume}%</span>
        </div>
      )}

      {/* Cosmic Background Drift Settings */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <span style={{ fontSize: '0.74rem', color: '#a1a1ad', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Background:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setParticlesEnabled((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              background: particlesEnabled ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              border: particlesEnabled ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.14)',
              color: particlesEnabled ? '#34d399' : '#a1a1ad',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={particlesEnabled ? 'Turn off galaxy stars during session' : 'Turn on galaxy stars during session'}
          >
            {particlesEnabled ? <Sparkles size={13} /> : <EyeOff size={13} />}
            <span>{particlesEnabled ? 'Galaxy Stars' : 'Stars Off'}</span>
          </button>

          {particlesEnabled && (
            <button
              type="button"
              onClick={() => setParticleSpeedIndex((prev) => (prev + 1) % PARTICLE_SPEEDS.length)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#f4f4f6',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Cycle cosmic drift speed"
            >
              <Gauge size={13} color="#34d399" />
              <span>{PARTICLE_SPEEDS[particleSpeedIndex].label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
