'use client';

import { X, Plus, Loader2 } from 'lucide-react';
import { CATEGORY_OPTIONS } from '../utils/plannerDateUtils';

export default function AddTaskModal({
  addingDayDate,
  newTask,
  setNewTask,
  saving,
  onClose,
  onSubmit
}) {
  if (!addingDayDate) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        animation: 'modalBackdropFadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          width: '90%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(180, 255, 100, 0.05)',
          animation: 'modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes modalBackdropFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalScaleIn {
            from { transform: scale(0.92); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Modal Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={18} />
        </button>

        {/* Title / Header */}
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)'
          }}>
            Add Task
          </h2>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quick Presets:</span>
            <button
              type="button"
              onClick={() => setNewTask(t => ({
                ...t,
                title: 'Practice Exam: Study Test',
                category: 'practice-exam',
                priority: 'high',
                duration: 60
              }))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--brand-primary, #6366f1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                cursor: 'pointer'
              }}
            >
              + Practice Exam
            </button>
            <button
              type="button"
              onClick={() => setNewTask(t => ({
                ...t,
                title: 'Mock Interview: System Design & Architecture',
                category: 'mock-interview',
                priority: 'high',
                duration: 30
              }))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'rgba(245, 166, 35, 0.12)',
                color: 'var(--accent, #f5a623)',
                border: '1px solid rgba(245, 166, 35, 0.3)',
                cursor: 'pointer'
              }}
            >
              + Mock Interview
            </button>
          </div>

          {/* Task Title & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TASK TITLE</label>
              <input
                className="input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}
                placeholder="e.g. Study Java OOP principles..."
                value={newTask.title}
                onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onSubmit(addingDayDate)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DATE</label>
              <input
                type="date"
                className="input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}
                value={newTask.scheduledDate ? new Date(newTask.scheduledDate).toISOString().split('T')[0] : addingDayDate.toISOString().split('T')[0]}
                onChange={(e) => setNewTask(t => ({ ...t, scheduledDate: new Date(e.target.value) }))}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DESCRIPTION</label>
            <textarea
              className="input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', minHeight: '60px', resize: 'vertical' }}
              placeholder="Optional details..."
              value={newTask.description}
              onChange={(e) => setNewTask(t => ({ ...t, description: e.target.value }))}
            />
          </div>

          {/* Category & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CATEGORY</label>
              <select
                className="input"
                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 'var(--radius-md)' }}
                value={newTask.category}
                onChange={(e) => setNewTask(t => ({ ...t, category: e.target.value }))}
              >
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PRIORITY</label>
              <select
                className="input"
                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 'var(--radius-md)' }}
                value={newTask.priority}
                onChange={(e) => setNewTask(t => ({ ...t, priority: e.target.value }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Start Time & Duration Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>START TIME</label>
              <input
                className="input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}
                type="time"
                value={newTask.startTime}
                onChange={(e) => setNewTask(t => ({ ...t, startTime: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DURATION</label>
              <select
                className="input"
                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 'var(--radius-md)' }}
                value={newTask.duration}
                onChange={(e) => setNewTask(t => ({ ...t, duration: Number(e.target.value) }))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hrs</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Recurring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RECURRENCE</label>
            <select
              className="input"
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
              value={newTask.isRecurring ? newTask.recurPattern : 'none'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'none') {
                  setNewTask(t => ({ ...t, isRecurring: false, recurPattern: 'none' }));
                } else {
                  setNewTask(t => ({ ...t, isRecurring: true, recurPattern: val }));
                }
              }}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ 
              flex: 2, 
              padding: '12px', 
              boxShadow: '0 8px 20px rgba(180, 255, 100, 0.25)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
            onClick={() => onSubmit(addingDayDate)}
            disabled={saving || !newTask.title.trim()}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
