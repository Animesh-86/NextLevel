'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, Map, Network, ArrowRight, ListTodo, Circle, Clock, Plus, Loader2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';
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

function itemId(item) {
  return item._id || item.id;
}

export default function WorkspacePage() {
  const [weekStart] = useState(() => getWeekStart(new Date()));
  const [tasks, setTasks] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  // Quick-add state for planner columns
  const [addingDay, setAddingDay] = useState(null);
  const [addingDayDate, setAddingDayDate] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '', description: '', category: 'study', priority: 'medium',
    startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily'
  });
  const [saving, setSaving] = useState(false);

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    const start = formatDateKey(weekStart);
    const end = formatDateKey(weekEnd);
    try {
      const [tasksRes, roadmapsRes, graphRes] = await Promise.all([
        apiFetch(`/api/planner?start=${start}&end=${end}`),
        apiFetch('/api/roadmaps'),
        apiFetch('/api/graph'),
      ]);
      const [tasksData, roadmapsData, graphData] = await Promise.all([
        tasksRes.json(),
        roadmapsRes.json(),
        graphRes.json(),
      ]);

      setTasks(tasksData.success ? tasksData.data || [] : []);
      setRoadmaps(roadmapsData.success ? roadmapsData.data || [] : []);
      setGraph(graphData.success ? graphData.data || { nodes: [], links: [] } : { nodes: [], links: [] });
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Task Handlers
  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' || currentStatus === 'done' ? 'todo' : 'completed';
    setTasks(prev => prev.map(t => (t.id === id || t._id === id) ? { ...t, status: nextStatus } : t));
    try {
      await apiFetch(`/api/planner/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error('Status toggle failed:', err);
      loadWorkspace();
    }
  };

  const handleDelete = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id && t._id !== id));
    try {
      await apiFetch(`/api/planner/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete failed:', err);
      loadWorkspace();
    }
  };

  const handleAddTask = async (date) => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          scheduledDate: formatDateKey(date),
          startTime: newTask.startTime || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => [...prev, data.data]);
      }
      setAddingDay(null);
      setNewTask({ title: '', description: '', category: 'study', priority: 'medium', startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily' });
    } catch (err) {
      console.error('Add task failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTaskModal = async (date) => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          scheduledDate: formatDateKey(newTask.scheduledDate || date),
          startTime: newTask.startTime || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => [...prev, data.data]);
      }
      setAddingDay(null);
      setAddingDayDate(null);
      setNewTask({ title: '', description: '', category: 'study', priority: 'medium', startTime: '', duration: 30, isRecurring: false, recurPattern: 'daily' });
    } catch (err) {
      console.error('Add task failed:', err);
    } finally {
      setSaving(false);
    }
  };


  const getTasksForDay = (day) => {
    return tasks.filter(t => isSameDay(t.scheduledDate, day));
  };

  // Filter stats for today
  const todayTasks = tasks.filter(t => isToday(t.scheduledDate));
  const completedTodayTasks = todayTasks.filter((task) => task.status === 'completed' || task.status === 'done').length;
  const activeRoadmaps = roadmaps.filter((roadmap) => roadmap.status !== 'completed');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Growth System</h1>
          <p className="capture-hub-subtitle">
            Plan the day, follow the journey, and connect what you learn.
          </p>
        </div>
        <Link className="btn btn-primary" href="/planner">
          <CalendarDays size={16} /> Open Planner
        </Link>
      </header>

      {/* Minimal Stats Row */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '2rem', 
        padding: '12px 20px', background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListTodo size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Today: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{todayTasks.length}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{completedTodayTasks}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Map size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Journeys: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeRoadmaps.length}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Knowledge Nodes: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{graph.nodes?.length || 0}</strong></span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <SkeletonCard height="260px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
            <SkeletonCard height="260px" />
            <SkeletonCard height="260px" />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* 7-Day Weekly Grid Card */}
          <section className="card" style={{ width: '100%' }}>
            <div className="card-title-row">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} /> Weekly Planner
              </h2>
              <Link className="dash-see-all" href="/planner">
                Planner Page <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="planner-grid" style={{ marginTop: 'var(--space-md)' }}>
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
          </section>

          {/* Bottom Grid: Journeys & Knowledge Graph on the same level */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 'var(--space-md)' 
          }}>
            
            {/* Journey Progress */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-title-row">
                  <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={18} /> Journey Progress
                  </h2>
                  <Link className="dash-see-all" href="/journey">
                    Journeys <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="dash-roadmap-list" style={{ marginTop: 'var(--space-sm)' }}>
                  {activeRoadmaps.slice(0, 4).map((roadmap) => (
                    <Link key={itemId(roadmap)} href="/journey" className="dash-roadmap-item">
                      <span className="dash-roadmap-name">{roadmap.title || roadmap.name || 'Untitled journey'}</span>
                      <div className="dash-roadmap-bar">
                        <div className="dash-roadmap-fill" style={{ width: `${roadmap.progress || 0}%` }} />
                      </div>
                      <span className="dash-roadmap-pct">{roadmap.progress || 0}%</span>
                    </Link>
                  ))}
                  {activeRoadmaps.length === 0 && (
                    <div className="dash-empty-mini">
                      <Map size={24} />
                      <p>No active journeys yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Knowledge Graph Card */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-title-row">
                  <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={18} /> Knowledge Graph
                  </h2>
                  <Link className="dash-see-all" href="/graph">
                    View 3D Graph <ArrowRight size={14} />
                  </Link>
                </div>
                
                <div className="dash-exam-grid" style={{ marginTop: 'var(--space-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div className="dash-exam-stat" style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    <span className="dash-exam-val" style={{ display: 'block', fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand)' }}>{graph.nodes?.length || 0}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nodes</span>
                  </div>
                  <div className="dash-exam-stat" style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    <span className="dash-exam-val" style={{ display: 'block', fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand)' }}>{graph.links?.length || 0}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connections</span>
                  </div>
                </div>

                <div className="dash-empty-mini" style={{ marginTop: 'var(--space-md)' }}>
                  <Network size={24} />
                  <p>Visualize how your captures, files, and journeys interconnect in 3D.</p>
                </div>
              </div>
            </section>

          </div>
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

            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                Add Task
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CATEGORY</label>
                  <select
                    className="input"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)' }}
                    value={newTask.category}
                    onChange={(e) => setNewTask(t => ({ ...t, category: e.target.value }))}
                  >
                    <option value="study">Study</option>
                    <option value="revision">Revision</option>
                    <option value="practice">Practice</option>
                    <option value="project">Project</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam-prep">Exam Prep</option>
                    <option value="other">Other</option>
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
