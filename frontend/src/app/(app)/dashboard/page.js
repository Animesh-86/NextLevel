'use client';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import DailyDigestCard from '@/components/DailyDigestCard';
import Link from 'next/link';
import {
  Flame, Target, BookOpen, Clock, Play, Map, Briefcase, FolderOpen,
  CalendarDays, Inbox, Link2, ChevronRight, CheckCircle2,
  Circle, BarChart3, BrainCircuit, Zap, ArrowUpRight
} from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useCurrentContext } from '@/lib/CurrentContext';

const METRICS = [
  { key: 'exams', label: 'Exams Taken', icon: BookOpen, getValue: (stats) => stats?.totalExamsTaken || 0 },
  { key: 'score', label: 'Avg Score', icon: Target, getValue: (stats) => `${stats?.avgScore || 0}%` },
  { key: 'tasks', label: 'Tasks Today', icon: CalendarDays, getValue: (_, tasks) => tasks.length },
  { key: 'hours', label: 'Study Hours', icon: Clock, getValue: (_, __, c) => `${c?.totalStudyHours || 0}h` },
];

const QUICK_ACTIONS = [
  { href: '/test', label: 'Focus Test', icon: Play, desc: 'Timed exam session' },
  { href: '/captures', label: 'Capture', icon: Inbox, desc: 'Save an idea fast' },
  { href: '/vault', label: 'File Vault', icon: FolderOpen, desc: 'Upload & organize' },
  { href: '/planner', label: 'Planner', icon: CalendarDays, desc: 'Plan your week' },
];

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setActiveContext } = useCurrentContext();

  useEffect(() => {
    setActiveContext("The user is viewing their main Dashboard, including quick actions, daily digest, and tasks for today.");
    return () => setActiveContext("");
  }, [setActiveContext]);

  useEffect(() => {
    async function loadAll() {
      try {
        const localDateKey = () => {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const todayStr = localDateKey();
        
        const [statsR, analyticsR, tasksR, capturesR] = await Promise.all([
          apiFetch('/api/stats').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch(`/api/planner?start=${todayStr}&end=${todayStr}`).then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/captures?limit=5').then(r => r.json()).catch(() => ({ success: false })),
        ]);
        if (statsR.success) setStats(statsR.data);
        if (analyticsR.success) setAnalytics(analyticsR.data);
        if (tasksR.success) setTodayTasks(tasksR.data || []);
        if (capturesR.success) setRecentCaptures((capturesR.data?.data || []).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadAll();
  }, []);

  async function handleStatusToggle(id, currentStatus) {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const res = await apiFetch(`/api/planner/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  }

  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const c = analytics?.counts || {};

  const tasksDone = todayTasks.filter(t => t.status === 'done').length;
  const taskProgress = todayTasks.length ? Math.round((tasksDone / todayTasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Glass Header Banner */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <span className="badge badge-stark">{formatDate()}</span>
            {analytics?.streak > 0 && (
              <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)' }}>
                <Flame size={14} style={{ color: 'var(--brand)' }} />
                {analytics.streak}-Day Streak
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
            {greeting}, {userName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
            Your knowledge base is growing. You have {analytics?.counts?.totalCaptures || 0} captures waiting to be synthesized.
          </p>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 'var(--space-md)' 
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Metrics Grid inside a Glass Panel */}
          <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} /> Performance Metrics
              </h2>
            </div>
            
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} height="80px" />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                {METRICS.map((m) => {
                  const Icon = m.icon;
                  const val = m.getValue(stats, todayTasks, c);
                  return (
                    <div key={m.key} style={{ 
                      background: 'var(--bg-surface)', 
                      padding: 'var(--space-sm) var(--space-md)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Icon size={14} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-geist, monospace)' }}>
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Actions Bento */}
          <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} /> Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link href={action.href} key={action.label} style={{
                    display: 'flex', flexDirection: 'column', padding: 'var(--space-sm)',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.transform = 'none';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ padding: '6px', background: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)' }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{action.label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Daily Digest Bento */}
          <section className="glass-panel" style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={18} /> Daily AI Digest
              </h2>
            </div>
            
            {loading ? (
              <SkeletonCard height="200px" />
            ) : (
              <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm)' }}>
                 <DailyDigestCard recentCaptures={recentCaptures} />
              </div>
            )}
          </section>

          {/* Tasks Bento */}
          <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Tasks for Today
              </h2>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} height="60px" />)}
              </div>
            ) : todayTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>{tasksDone} of {todayTasks.length} completed</span>
                  <span>{taskProgress}%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-accent)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${taskProgress}%`, background: 'var(--brand)', transition: 'width 0.3s' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-sm)' }}>
                  {todayTasks.slice(0, 5).map((task) => {
                    const isDone = task.status === 'done';
                    return (
                      <div key={task.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)', opacity: isDone ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}>
                        <button 
                          onClick={() => handleStatusToggle(task.id, task.status)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0, background: 'none', border: 'none',
                            color: isDone ? 'var(--brand)' : 'var(--text-muted)'
                          }}
                          title={isDone ? "Mark as Todo" : "Mark as Done"}
                        >
                          {isDone ? (
                            <CheckCircle2 size={16} style={{ fill: 'var(--brand)', color: 'var(--bg-primary)' }} />
                          ) : (
                            <Circle size={16} />
                          )}
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 600, 
                            textDecoration: isDone ? 'line-through' : 'none',
                            color: isDone ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}>
                            {task.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {task.startTime && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                              </span>
                            )}
                            {!task.startTime && task.duration && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                {task.duration} min
                              </span>
                            )}
                             {task.category && !task.description?.startsWith('Google Calendar Event') && (
                              <span style={{ 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                background: 'var(--bg-accent)', 
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {task.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-lg) 0', color: 'var(--text-muted)' }}>
                <CalendarDays size={32} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No tasks scheduled for today.</p>
                <Link href="/planner" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Plan Day</Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
