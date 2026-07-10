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
  const [newTask, setNewTask] = useState({
    title: '', category: 'study', priority: 'medium',
    startTime: '', duration: 30
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
      setNewTask({ title: '', category: 'study', priority: 'medium', startTime: '', duration: 30 });
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

                  {/* Inline Add Form */}
                  {addingDay === dayKey ? (
                    <div className="planner-add-form">
                      <input
                        className="input planner-add-input"
                        placeholder="Task name..."
                        value={newTask.title}
                        onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(day)}
                      />
                      <div className="planner-add-options">
                        <select
                          className="input planner-add-select"
                          value={newTask.category}
                          onChange={(e) => setNewTask(t => ({ ...t, category: e.target.value }))}
                        >
                          {categoryOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <select
                          className="input planner-add-select"
                          value={newTask.priority}
                          onChange={(e) => setNewTask(t => ({ ...t, priority: e.target.value }))}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="planner-add-options">
                        <input
                          className="input planner-add-select"
                          type="time"
                          placeholder="Start time"
                          value={newTask.startTime}
                          onChange={(e) => setNewTask(t => ({ ...t, startTime: e.target.value }))}
                        />
                        <select
                          className="input planner-add-select"
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
                      <div className="planner-add-actions">
                        <button
                          className="btn btn-primary planner-add-save"
                          onClick={() => handleAddTask(day)}
                          disabled={saving || !newTask.title.trim()}
                        >
                          {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                          Add
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setAddingDay(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="planner-add-btn"
                      onClick={() => {
                        setAddingDay(dayKey);
                        setNewTask({ title: '', category: 'study', priority: 'medium', startTime: '', duration: 30 });
                      }}
                    >
                      <Plus size={14} /> Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
