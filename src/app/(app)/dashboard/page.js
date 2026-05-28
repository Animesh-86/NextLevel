'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Flame, Target, BookOpen, Clock, Play, Map, Briefcase, FolderOpen,
  CalendarDays, Inbox, Link2, TrendingUp, ChevronRight, CheckCircle2,
  Circle, ArrowRight, Loader2, BarChart3, BrainCircuit
} from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';

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
          fetch('/api/stats').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false })),
          fetch(`/api/planner?start=${new Date().toISOString().split('T')[0]}&end=${new Date().toISOString().split('T')[0]}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/captures?limit=5').then(r => r.json()).catch(() => ({ success: false })),
        ]);
        if (statsR.success) setStats(statsR.data);
        if (analyticsR.success) setAnalytics(analyticsR.data);
        if (tasksR.success) setTodayTasks(tasksR.data || []);
        if (capturesR.success) setRecentCaptures((capturesR.data || []).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadAll();
  }, []);

  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const c = analytics?.counts || {};

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Hero Header */}
      <header className="dash-hero">
        <div className="dash-hero-text">
          <h1 className="dash-hero-title">{greeting}, {userName}</h1>
          <p className="dash-hero-sub">Your learning command center. Everything at a glance.</p>
        </div>
        {analytics?.streak > 0 && (
          <div className="dash-streak"><Flame size={18} /> {analytics.streak}-Day Streak</div>
        )}
      </header>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} height="100px" />)}
        </div>
      ) : (
        <>
          {/* Quick Stats Row */}
          <div className="dash-stats-row">
            {[
              { label: 'Exams Taken', value: stats?.totalExamsTaken || 0, icon: BookOpen, color: '#3b82f6' },
              { label: 'Avg Score', value: `${stats?.avgScore || 0}%`, icon: Target, color: '#22c55e' },
              { label: 'Tasks Today', value: todayTasks.length, icon: CalendarDays, color: '#f59e0b' },
              { label: 'Study Hours', value: `${c.totalStudyHours || 0}h`, icon: Clock, color: '#a855f7' },
              { label: 'Roadmaps', value: c.roadmapsActive || 0, icon: Map, color: '#ef4444' },
              { label: 'Applications', value: c.applications || 0, icon: Briefcase, color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} className="dash-stat-card">
                <div className="dash-stat-icon" style={{ color: s.color }}><s.icon size={20} /></div>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="dash-main-grid">
            {/* Left Column */}
            <div className="dash-left">
              {/* Today's Tasks */}
              <section className="card dash-section">
                <div className="card-title-row">
                  <h2 className="card-title"><CalendarDays size={18} /> Today&apos;s Tasks</h2>
                  <Link href="/planner" className="dash-see-all">View Planner <ChevronRight size={14} /></Link>
                </div>
                {todayTasks.length > 0 ? (
                  <div className="dash-task-list">
                    {todayTasks.map(t => (
                      <div key={t._id} className={`dash-task-item ${t.status}`}>
                        {t.status === 'done' ? <CheckCircle2 size={16} color="#22c55e" /> : <Circle size={16} />}
                        <span className={t.status === 'done' ? 'line-through' : ''}>{t.title}</span>
                        {t.duration > 0 && <span className="dash-task-dur">{t.duration}min</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-mini"><CalendarDays size={28} strokeWidth={1} /><p>No tasks for today</p>
                    <Link href="/planner" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Plan your day</Link>
                  </div>
                )}
              </section>

              {/* Roadmap Progress */}
              {analytics?.roadmapSummaries?.length > 0 && (
                <section className="card dash-section">
                  <div className="card-title-row">
                    <h2 className="card-title"><Map size={18} /> Active Roadmaps</h2>
                    <Link href="/journey" className="dash-see-all">All Roadmaps <ChevronRight size={14} /></Link>
                  </div>
                  <div className="dash-roadmap-list">
                    {analytics.roadmapSummaries.slice(0, 3).map(r => (
                      <Link href="/journey" key={r._id} className="dash-roadmap-item">
                        <span className="dash-roadmap-name">{r.title}</span>
                        <div className="dash-roadmap-bar">
                          <div className="dash-roadmap-fill" style={{ width: `${r.progress}%` }} />
                        </div>
                        <span className="dash-roadmap-pct">{r.progress}%</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Activity Heatmap */}
              {analytics?.heatmap && (
                <section className="card dash-section">
                  <div className="card-title-row">
                    <h2 className="card-title"><BarChart3 size={18} /> Activity — 90 Days</h2>
                    <Link href="/journey?tab=analytics" className="dash-see-all">Full Analytics <ChevronRight size={14} /></Link>
                  </div>
                  <div className="dash-heatmap">
                    {(() => {
                      const days = [];
                      const today = new Date();
                      const hmap = analytics.heatmap || {};
                      
                      for (let i = 89; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(today.getDate() - i);
                        const dateStr = d.toISOString().split('T')[0];
                        days.push({ date: dateStr, count: hmap[dateStr] || 0 });
                      }
                      
                      const max = Math.max(...Object.values(hmap), 1);
                      return days.map(({ date, count }) => (
                        <div key={date} className="heatmap-cell" title={`${date}: ${count}`}
                          style={{
                            opacity: count === 0 ? 0.05 : 0.25 + (count / max) * 0.75,
                            background: count > 0 ? '#4ade80' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            boxShadow: count > 0 ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'
                          }} />
                      ));
                    })()}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="dash-right">
              {/* Quick Actions */}
              <section className="card dash-section">
                <h2 className="card-title">⚡ Quick Actions</h2>
                <div className="dash-actions">
                  {[
                    { href: '/test', label: 'Focus Test', icon: Play, desc: 'Timed exam' },
                    { href: '/captures', label: 'Capture', icon: Inbox, desc: 'Quick save' },
                    { href: '/vault', label: 'File Vault', icon: FolderOpen, desc: 'Upload files' },
                    { href: '/journey', label: 'Journey', icon: Map, desc: 'Track progress' },
                    { href: '/links', label: 'Links', icon: Link2, desc: 'Bookmarks' },
                    { href: '/planner', label: 'Planner', icon: CalendarDays, desc: 'Plan week' },
                  ].map(a => (
                    <Link key={a.href} href={a.href} className="dash-action-card">
                      <a.icon size={20} /><span className="dash-action-label">{a.label}</span>
                      <span className="dash-action-desc">{a.desc}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Recent Captures */}
              <section className="card dash-section">
                <div className="card-title-row">
                  <h2 className="card-title"><Inbox size={18} /> Recent Captures</h2>
                  <Link href="/captures" className="dash-see-all">All <ChevronRight size={14} /></Link>
                </div>
                {recentCaptures.length > 0 ? (
                  <div className="dash-capture-list">
                    {recentCaptures.map(c => (
                      <div key={c._id} className="dash-capture-item">
                        <span className="dash-capture-title">{c.title}</span>
                        <span className="dash-capture-cat">{c.category}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-mini"><Inbox size={28} strokeWidth={1} /><p>No captures yet</p></div>
                )}
              </section>

              {/* Exam Summary */}
              {stats && (
                <section className="card dash-section">
                  <h2 className="card-title"><BrainCircuit size={18} /> Exam Overview</h2>
                  <div className="dash-exam-grid">
                    <div className="dash-exam-stat"><span className="dash-exam-val">{stats.passRate || 0}%</span><span>Pass Rate</span></div>
                    <div className="dash-exam-stat"><span className="dash-exam-val">{stats.bestScore || 0}%</span><span>Best Score</span></div>
                    <div className="dash-exam-stat"><span className="dash-exam-val">{stats.needsReview || 0}</span><span>Need Review</span></div>
                    <div className="dash-exam-stat"><span className="dash-exam-val">{stats.totalQuestions || 0}</span><span>Questions</span></div>
                  </div>
                  <Link href="/test" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}>
                    <Play size={16} /> Take a Test
                  </Link>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
