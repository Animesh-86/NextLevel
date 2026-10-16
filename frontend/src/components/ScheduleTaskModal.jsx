'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, X, ChevronDown } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ScheduleTaskModal({
  open,
  onClose,
  defaultTitle = '',
  defaultDescription = '',
  defaultCategory = 'practice-exam', // 'practice-exam' | 'mock-interview'
  defaultDuration = 30,
  onSuccess
}) {
  const toast = useToast();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(defaultDuration);
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  // Set default date to today or tomorrow
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setDuration(defaultDuration);

      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setScheduledDate(`${year}-${month}-${day}`);
    }
  }, [open, defaultTitle, defaultDescription, defaultDuration]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledDate) {
      toast.error('Please enter a title and date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: defaultCategory,
        priority,
        scheduledDate,
        startTime: startTime || null,
        duration: parseInt(duration, 10) || 30,
        isRecurring: false,
        status: 'todo'
      };

      const res = await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          defaultCategory === 'mock-interview'
            ? 'Mock interview scheduled in your Planner!'
            : 'Practice exam scheduled in your Planner!'
        );
        if (onSuccess) onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.error || 'Failed to schedule task');
      }
    } catch (err) {
      toast.error('Failed to schedule in planner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#0d0d12',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-tint, rgba(99, 102, 241, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary, #6366f1)'
            }}>
              <CalendarDays size={18} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f4f4f6' }}>
              {defaultCategory === 'mock-interview' ? 'Schedule AI Mock Interview' : 'Schedule Practice Exam'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Session Title
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design Mock Interview"
              required
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Date
              </label>
              <input
                type="date"
                className="input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Time
              </label>
              <input
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Duration (min)
              </label>
              <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '10px 36px 10px 14px',
                    borderRadius: '8px',
                    background: '#101014',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f4f4f6',
                    fontSize: '0.88rem',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    margin: 0
                  }}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#a1a1ad'
                  }}
                />
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Priority
              </label>
              <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '10px 36px 10px 14px',
                    borderRadius: '8px',
                    background: '#101014',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f4f4f6',
                    fontSize: '0.88rem',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    margin: 0
                  }}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#a1a1ad'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Notes / Description (Optional)
            </label>
            <textarea
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Focus on Spring Boot DI, caching, and concurrency topics"
              style={{ width: '100%', resize: 'none', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ padding: '0.6rem 1.1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '0.6rem 1.3rem' }}
            >
              {saving ? 'Scheduling...' : 'Add to Planner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
