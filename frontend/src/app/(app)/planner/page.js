'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays,
  Clock, CheckCircle2, BarChart3, X, Loader2
} from 'lucide-react';
import PlannerTaskCard from '@/components/PlannerTaskCard';

const categoryOptions = [
  { value: 'study', label: 'Study' },
  { value: 'revision', label: 'Revision' },
  { value: 'practice', label: 'Practice' },
  { value: 'project', label: 'Project' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'other', label: 'Other' },
];

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(start) {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a, b) {
  return formatDateKey(new Date(a)) === formatDateKey(new Date(b));
}

function isToday(date) {
  return isSameDay(date, new Date());
}

export default function StudyPlanner() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick-add state
  const [addingDay, setAddingDay] = useState(null);
  const [addingDayDate, setAddingDayDate] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '', description: '', category: 'study', priority: 'medium',
    startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily', scheduledDate: ''
  });
  const [saving, setSaving] = useState(false);

  const weekEnd = getWeekEnd(weekStart);

  // Generate 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const start = formatDateKey(weekStart);
      const end = formatDateKey(weekEnd);
      const res = await apiFetch(`/api/planner?start=${start}&end=${end}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function goToday() {
    setWeekStart(getWeekStart(new Date()));
  }

  function getTasksForDay(day) {
    return tasks.filter(t => isSameDay(t.scheduledDate, day));
  }

  async function handleStatusToggle(id, newStatus) {
    try {
      await apiFetch(`/api/planner/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/planner/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleAddTask(date) {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          scheduledDate: formatDateKey(date),
          startTime: newTask.startTime || null,
        }),
      });
      setAddingDay(null);
      setNewTask({ title: '', description: '', category: 'study', priority: 'medium', startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily', scheduledDate: '' });
      fetchTasks();
    } catch (err) {
      console.error('Add task failed:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTaskModal(date) {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          scheduledDate: formatDateKey(newTask.scheduledDate || date),
          startTime: newTask.startTime || null,
        }),
      });
      setAddingDay(null);
      setAddingDayDate(null);
      setNewTask({ title: '', description: '', category: 'study', priority: 'medium', startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily', scheduledDate: '' });
      fetchTasks();
    } catch (err) {
      console.error('Add task failed:', err);
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const totalMinutes = tasks.filter(t => t.status !== 'skipped').reduce((s, t) => s + (t.duration || 0), 0);
  const doneMinutes = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.duration || 0), 0);

  const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' – ' + weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Planner</h1>
          <p className="capture-hub-subtitle">Plan your week, track your progress</p>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="planner-week-nav">
        <button className="btn btn-secondary" onClick={prevWeek}>
          <ChevronLeft size={16} />
        </button>
        <button className="planner-today-btn" onClick={goToday}>Today</button>
        <h2 className="planner-week-label">{weekLabel}</h2>
        <button className="btn btn-secondary" onClick={nextWeek}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="planner-stats">
        <div className="planner-stat">
          <CalendarDays size={14} />
          <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
        </div>
        <div className="planner-stat">
          <CheckCircle2 size={14} />
          <span>{doneTasks}/{totalTasks} done</span>
        </div>
        <div className="planner-stat">
          <Clock size={14} />
          <span>{Math.round(totalMinutes / 60)}h planned</span>
        </div>
        <div className="planner-stat">
          <BarChart3 size={14} />
          <span>{Math.round(doneMinutes / 60)}h completed</span>
        </div>
        {totalTasks > 0 && (
          <div className="planner-progress-bar">
            <div
              className="planner-progress-fill"
              style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Weekly Grid */}
      {loading ? (
        <div className="planner-grid">
          {days.map((day, i) => (
            <div key={i} className="planner-column skeleton">
              <div className="planner-day-header">
                <span className="planner-day-name">{dayNames[i]}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="planner-grid">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const dayKey = formatDateKey(day);
            const today = isToday(day);

            return (
              <div key={dayKey} className={`planner-column ${today ? 'today' : ''}`}>
                <div className="planner-day-header">
                  <span className="planner-day-name">{dayNames[i]}</span>
                  <span className={`planner-day-date ${today ? 'today' : ''}`}>
                    {day.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="planner-day-count">{dayTasks.length}</span>
                  )}
                </div>

                <div className="planner-day-tasks">
                  {dayTasks.map(task => (
                    <PlannerTaskCard
                      key={task.id || task._id}
                      task={task}
                      onStatusToggle={handleStatusToggle}
                      onDelete={handleDelete}
                    />
                  ))}

                  <button
                    className="planner-add-btn"
                    onClick={() => {
                      setAddingDay(dayKey);
                      setAddingDayDate(day);
                      setNewTask({ title: '', description: '', category: 'study', priority: 'medium', startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily', scheduledDate: day });
                    }}
                  >
                    <Plus size={14} /> Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {addingDayDate && (
        <div 
          onClick={() => {
            setAddingDay(null);
            setAddingDayDate(null);
          }}
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
            {/* Modal style injected dynamically */}
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
              onClick={() => {
                setAddingDay(null);
                setAddingDayDate(null);
              }}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTaskModal(addingDayDate)}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CATEGORY</label>
                  <select
                    className="input"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
                    value={newTask.category}
                    onChange={(e) => setNewTask(t => ({ ...t, category: e.target.value }))}
                  >
                    {categoryOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PRIORITY</label>
                  <select
                    className="input"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>START TIME</label>
                  <input
                    className="input"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
                    type="time"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask(t => ({ ...t, startTime: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DURATION</label>
                  <select
                    className="input"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
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
                onClick={() => {
                  setAddingDay(null);
                  setAddingDayDate(null);
                }}
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
                onClick={() => handleAddTaskModal(addingDayDate)}
                disabled={saving || !newTask.title.trim()}
              >
                {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                Add Task
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
