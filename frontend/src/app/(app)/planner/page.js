'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays,
  Clock, CheckCircle2, BarChart3
} from 'lucide-react';
import PlannerTaskCard from '@/components/PlannerTaskCard';
import AddTaskModal from './components/AddTaskModal';
import {
  DAY_NAMES,
  getWeekStart,
  getWeekEnd,
  formatDateKey,
  isSameDay,
  isToday
} from './utils/plannerDateUtils';

export default function StudyPlanner() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick-add state
  const [, setAddingDay] = useState(null);
  const [addingDayDate, setAddingDayDate] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '', description: '', category: 'study', priority: 'medium',
    startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily', scheduledDate: ''
  });
  const [saving, setSaving] = useState(false);

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  // Generate 7 days
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

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
  }, [weekStart, weekEnd]);

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
                <span className="planner-day-name">{DAY_NAMES[i]}</span>
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
                  <span className="planner-day-name">{DAY_NAMES[i]}</span>
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

      <AddTaskModal
        addingDayDate={addingDayDate}
        newTask={newTask}
        setNewTask={setNewTask}
        saving={saving}
        onClose={() => {
          setAddingDay(null);
          setAddingDayDate(null);
        }}
        onSubmit={handleAddTaskModal}
      />
    </div>
  );
}
