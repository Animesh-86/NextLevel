'use client';
import { useState, useEffect, useMemo } from 'react';
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

const METRICS = [
  { key: 'exams', label: 'Exams Taken', icon: BookOpen, getValue: (stats) => stats?.totalExamsTaken || 0 },
  { key: 'score', label: 'Avg Score', icon: Target, getValue: (stats) => `${stats?.avgScore || 0}%` },
  { key: 'tasks', label: 'Tasks Today', icon: CalendarDays, getValue: (_, tasks) => tasks.length },
  { key: 'hours', label: 'Study Hours', icon: Clock, getValue: (_, __, c) => `${c.totalStudyHours || 0}h` },
  { key: 'roadmaps', label: 'Roadmaps', icon: Map, getValue: (_, __, c) => c.roadmapsActive || 0 },
  { key: 'apps', label: 'Applications', icon: Briefcase, getValue: (_, __, c) => c.applications || 0 },
];

const QUICK_ACTIONS = [
  { href: '/test', label: 'Focus Test', icon: Play, desc: 'Timed exam session' },
  { href: '/captures', label: 'Capture', icon: Inbox, desc: 'Save an idea fast' },
  { href: '/vault', label: 'File Vault', icon: FolderOpen, desc: 'Upload & organize' },
  { href: '/journey', label: 'Journey', icon: Map, desc: 'Track your growth' },
  { href: '/links', label: 'Links', icon: Link2, desc: 'Saved bookmarks' },
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

  useEffect(() => {
    async function loadAll() {
      try {
        const [statsR, analyticsR, tasksR, capturesR] = await Promise.all([
          apiFetch('/api/stats').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch(`/api/planner?start=${new Date().toISOString().split('T')[0]}&end=${new Date().toISOString().split('T')[0]}`).then(r => r.json()).catch(() => ({ success: false })),
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

  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const c = analytics?.counts || {};

  const tasksDone = todayTasks.filter(t => t.status === 'done').length;
  const taskProgress = todayTasks.length ? Math.round((tasksDone / todayTasks.length) * 100) : 0;



  return (
    <div className="dash-page">
      <header className="dash-hero-premium">
        <div className="dash-hero-grid" aria-hidden />
        <div className="dash-hero-inner">
          <div className="dash-hero-top">
            <span className="dash-date-pill">{formatDate()}</span>
            {analytics?.streak > 0 && (
              <span className="dash-streak-pill">
                <Flame size={14} />
                {analytics.streak}-day streak
              </span>
            )}
          </div>
          <h1 className="dash-hero-display">
            {greeting}, <span className="dash-hero-name">{userName}</span>
          </h1>
          <p className="dash-hero-tagline">
            Your command center — track progress, plan focus, and level up.
          </p>
        </div>
      </header>

      <DailyDigestCard />

      {loading ? (
        <div className="dash-metrics-grid">
          {Array(6).fill(0).map((_, i) => (
            <SkeletonCard key={i} height="120px" />
          ))}
        </div>
      ) : (
        <>
          <div className="dash-metrics-grid">
            {METRICS.map((m, i) => (
              <div key={m.key} className="dash-metric" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="dash-metric-icon">
                  <m.icon size={18} strokeWidth={1.75} />
                </div>
                <div className="dash-metric-body">
                  <span className="dash-metric-value">{m.getValue(stats, todayTasks, c)}</span>
                  <span className="dash-metric-label">{m.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="dash-bento">
            {/* Today's Tasks — large panel */}
            <section className="dash-panel dash-panel-tasks">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <CalendarDays size={16} />
                  <h2>Today&apos;s Tasks</h2>
                </div>
                <Link href="/planner" className="dash-panel-link">
                  Planner <ChevronRight size={14} />
                </Link>
              </div>

              {todayTasks.length > 0 ? (
                <>
                  <div className="dash-task-progress">
                    <div className="dash-task-progress-ring" style={{ '--pct': taskProgress }}>
                      <svg viewBox="0 0 36 36">
                        <circle className="dash-ring-bg" cx="18" cy="18" r="15.5" />
                        <circle className="dash-ring-fill" cx="18" cy="18" r="15.5" />
                      </svg>
                      <span className="dash-ring-label">{taskProgress}%</span>
                    </div>
                    <div className="dash-task-progress-meta">
                      <span className="dash-task-progress-count">{tasksDone}/{todayTasks.length} complete</span>
                      <span className="dash-task-progress-sub">Keep the momentum going</span>
                    </div>
                  </div>
                  <div className="dash-task-list">
                    {todayTasks.map(t => (
                      <div key={t._id} className={`dash-task-item ${t.status}`}>
                        {t.status === 'done' ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                        <span className={t.status === 'done' ? 'line-through' : ''}>{t.title}</span>
                        {t.duration > 0 && <span className="dash-task-dur">{t.duration}m</span>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dash-empty-mini">
                  <CalendarDays size={32} strokeWidth={1} />
                  <p>Nothing scheduled yet</p>
                  <Link href="/planner" className="btn btn-primary btn-sm">Plan your day</Link>
                </div>
              )}
            </section>

            {/* Quick Actions — tall sidebar panel */}
            <section className="dash-panel dash-panel-actions">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <Zap size={16} />
                  <h2>Quick Actions</h2>
                </div>
              </div>
              <div className="dash-actions-premium">
                {QUICK_ACTIONS.map(a => (
                  <Link key={a.href} href={a.href} className="dash-action-tile">
                    <div className="dash-action-tile-icon">
                      <a.icon size={18} strokeWidth={1.75} />
                    </div>
                    <div className="dash-action-tile-text">
                      <span className="dash-action-tile-label">{a.label}</span>
                      <span className="dash-action-tile-desc">{a.desc}</span>
                    </div>
                    <ArrowUpRight size={14} className="dash-action-tile-arrow" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Roadmaps */}
            {analytics?.roadmapSummaries?.length > 0 && (
              <section className="dash-panel dash-panel-roadmaps">
                <div className="dash-panel-head">
                  <div className="dash-panel-title-group">
                    <Map size={16} />
                    <h2>Active Roadmaps</h2>
                  </div>
                  <Link href="/journey" className="dash-panel-link">
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="dash-roadmap-list">
                  {analytics.roadmapSummaries.slice(0, 3).map(r => (
                    <Link href="/journey" key={r._id} className="dash-roadmap-item">
                      <div className="dash-roadmap-top">
                        <span className="dash-roadmap-name">{r.title}</span>
                        <span className="dash-roadmap-pct">{r.progress}%</span>
                      </div>
                      <div className="dash-roadmap-bar">
                        <div className="dash-roadmap-fill" style={{ width: `${r.progress}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}


            {/* Recent Captures */}
            <section className="dash-panel dash-panel-captures">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <Inbox size={16} />
                  <h2>Recent Captures</h2>
                </div>
                <Link href="/captures" className="dash-panel-link">
                  All <ChevronRight size={14} />
                </Link>
              </div>
              {recentCaptures.length > 0 ? (
                <div className="dash-capture-list">
                  {recentCaptures.map(cap => (
                    <Link key={cap.id} href={`/captures/${cap.id}`} className="dash-capture-item">
                      <span className="dash-capture-title">{cap.title}</span>
                      <span className="dash-capture-cat">{cap.category}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="dash-empty-mini">
                  <Inbox size={28} strokeWidth={1} />
                  <p>No captures yet</p>
                </div>
              )}
            </section>

            {/* Exam Overview */}
            {stats && (
              <section className="dash-panel dash-panel-exam">
                <div className="dash-panel-head">
                  <div className="dash-panel-title-group">
                    <BrainCircuit size={16} />
                    <h2>Exam Overview</h2>
                  </div>
                </div>
                <div className="dash-exam-grid">
                  <div className="dash-exam-stat">
                    <span className="dash-exam-val">{stats.passRate || 0}%</span>
                    <span>Pass Rate</span>
                  </div>
                  <div className="dash-exam-stat">
                    <span className="dash-exam-val">{stats.bestScore || 0}%</span>
                    <span>Best Score</span>
                  </div>
                  <div className="dash-exam-stat">
                    <span className="dash-exam-val">{stats.needsReview || 0}</span>
                    <span>Need Review</span>
                  </div>
                  <div className="dash-exam-stat">
                    <span className="dash-exam-val">{stats.totalQuestions || 0}</span>
                    <span>Questions</span>
                  </div>
                </div>
                <Link href="/test" className="btn btn-primary dash-exam-cta">
                  <Play size={16} /> Start a Focus Test
                </Link>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
