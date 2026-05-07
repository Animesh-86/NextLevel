'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Map, Briefcase, BarChart3, Plus, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Clock, Trash2, Loader2, Play, Pause,
  ExternalLink, Building2, X
} from 'lucide-react';

const categoryColors = {
  dsa: '#ef4444', 'system-design': '#3b82f6', 'web-dev': '#22c55e',
  devops: '#a855f7', project: '#f59e0b', career: '#ec4899', 'ml-ai': '#06b6d4', other: '#9ca3af',
};
const categoryEmojis = {
  dsa: '', 'system-design': '', 'web-dev': '', devops: '',
  project: '', career: '', 'ml-ai': '', other: '',
};
const statusColors = {
  bookmarked: '#6b7280', applied: '#3b82f6', screening: '#f59e0b',
  technical: '#a855f7', onsite: '#ec4899', offer: '#22c55e',
  accepted: '#10b981', rejected: '#ef4444', ghosted: '#6b7280',
};
const statusLabels = {
  bookmarked: 'Saved', applied: 'Applied', screening: 'Screening',
  technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
  accepted: 'Accepted', rejected: 'Rejected', ghosted: 'Ghosted',
};
const statusOrder = ['bookmarked','applied','screening','technical','onsite','offer','accepted','rejected','ghosted'];

export default function JourneyPage() {
  const [tab, setTab] = useState('roadmaps');
  const [roadmaps, setRoadmaps] = useState([]);
  const [apps, setApps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [expandedRoadmap, setExpandedRoadmap] = useState(null);
  const [appForm, setAppForm] = useState({ company: '', role: '', type: 'full-time', url: '', location: '', salary: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'roadmaps') {
        const [r, t] = await Promise.all([
          fetch('/api/roadmaps').then(r => r.json()),
          fetch('/api/roadmaps?templates=true').then(r => r.json()),
        ]);
        if (r.success) setRoadmaps(r.data);
        if (t.success) setTemplates(t.data);
      } else if (tab === 'applications') {
        const r = await fetch('/api/applications').then(r => r.json());
        if (r.success) setApps(r.data);
      } else {
        const r = await fetch('/api/analytics').then(r => r.json());
        if (r.success) setAnalytics(r.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createFromTemplate(idx) {
    await fetch('/api/roadmaps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateIndex: idx }),
    });
    setShowTemplates(false);
    fetchData();
  }

  async function toggleTask(roadmapId, milestoneId, taskId) {
    await fetch(`/api/roadmaps/${roadmapId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleTask: { milestoneId, taskId } }),
    });
    fetchData();
  }

  async function deleteRoadmap(id) {
    await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function createApp() {
    if (!appForm.company || !appForm.role) return;
    await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appForm),
    });
    setShowAppForm(false);
    setAppForm({ company: '', role: '', type: 'full-time', url: '', location: '', salary: '', notes: '' });
    fetchData();
  }

  async function updateAppStatus(id, status) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function deleteApp(id) {
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Journey Tracker</h1>
          <p className="capture-hub-subtitle">Track roadmaps, applications & progress</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="journey-tabs">
        {[
          { key: 'roadmaps', label: 'Roadmaps', icon: Map },
          { key: 'applications', label: 'Applications', icon: Briefcase },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map(t => (
          <button key={t.key} className={`journey-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : (
        <>
          {/* ═══ ROADMAPS TAB ═══ */}
          {tab === 'roadmaps' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setShowTemplates(!showTemplates)}>
                  <Plus size={16} /> Use Template
                </button>
              </div>

              {showTemplates && (
                <div className="journey-templates">
                  {templates.map((t, i) => (
                    <div key={i} className="journey-template-card" style={{ borderLeftColor: t.color }}>
                      <h4>{categoryEmojis[t.category]} {t.title}</h4>
                      <p>{t.description}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.milestones.length} milestones · {t.milestones.reduce((s, m) => s + m.tasks.length, 0)} tasks
                      </div>
                      <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => createFromTemplate(i)}>
                        <Plus size={14} /> Start This
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {roadmaps.length === 0 && !showTemplates ? (
                <div className="capture-empty-state">
                  <Map size={56} strokeWidth={1} />
                  <h3>No roadmaps yet</h3>
                  <p>Start a learning roadmap from our templates or create your own</p>
                </div>
              ) : (
                <div className="journey-roadmaps">
                  {roadmaps.map(r => {
                    const isExpanded = expandedRoadmap === r._id;
                    return (
                      <div key={r._id} className="roadmap-card" style={{ borderLeftColor: categoryColors[r.category] || '#fff' }}>
                        <div className="roadmap-header" onClick={() => setExpandedRoadmap(isExpanded ? null : r._id)}>
                          <div className="roadmap-info">
                            <h3>{categoryEmojis[r.category]} {r.title}</h3>
                            <div className="roadmap-meta">
                              <span className={`roadmap-status ${r.status}`}>{r.status}</span>
                              <span>{r.milestones.length} milestones</span>
                              <span>Due {new Date(r.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                          <div className="roadmap-progress-ring">
                            <svg width="52" height="52" viewBox="0 0 52 52">
                              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border-light)" strokeWidth="4" />
                              <circle cx="26" cy="26" r="22" fill="none" stroke={categoryColors[r.category] || '#fff'}
                                strokeWidth="4" strokeLinecap="round" strokeDasharray={`${r.overallProgress * 1.38} 999`}
                                transform="rotate(-90 26 26)" style={{ transition: 'stroke-dasharray 0.5s' }} />
                            </svg>
                            <span className="roadmap-progress-text">{r.overallProgress}%</span>
                          </div>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>

                        {/* SVG Road Path */}
                        <div className="roadmap-path">
                          <div className="roadmap-path-line" />
                          {r.milestones.map((m, mi) => {
                            const tasksDone = m.tasks.filter(t => t.done).length;
                            const total = m.tasks.length;
                            const pct = total > 0 ? Math.round((tasksDone / total) * 100) : (m.status === 'completed' ? 100 : 0);
                            return (
                              <div key={m._id} className={`roadmap-node ${m.status}`}>
                                <div className="roadmap-node-dot" style={{
                                  borderColor: m.status === 'completed' ? '#22c55e' : m.status === 'in-progress' ? '#f59e0b' : 'var(--border-strong)',
                                  background: m.status === 'completed' ? '#22c55e' : 'var(--bg-primary)',
                                }}>
                                  {m.status === 'completed' && <CheckCircle2 size={12} color="#000" />}
                                  {m.status === 'in-progress' && <Play size={10} />}
                                </div>
                                <span className="roadmap-node-label">{m.title}</span>
                                {total > 0 && <span className="roadmap-node-count">{tasksDone}/{total}</span>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Expanded: milestone tasks */}
                        {isExpanded && (
                          <div className="roadmap-milestones">
                            {r.milestones.map(m => (
                              <div key={m._id} className="roadmap-milestone">
                                <h4 className="roadmap-milestone-title">{m.title}</h4>
                                <div className="roadmap-tasks">
                                  {m.tasks.map(t => (
                                    <button key={t._id} className={`roadmap-task ${t.done ? 'done' : ''}`}
                                      onClick={() => toggleTask(r._id, m._id, t._id)}>
                                      {t.done ? <CheckCircle2 size={14} color="#22c55e" /> : <Circle size={14} />}
                                      <span>{t.title}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => deleteRoadmap(r._id)}>
                              <Trash2 size={14} /> Delete Roadmap
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ APPLICATIONS TAB ═══ */}
          {tab === 'applications' && (
            <div>
              <button className="btn btn-primary" style={{ marginBottom: '1.5rem' }} onClick={() => setShowAppForm(!showAppForm)}>
                <Plus size={16} /> Add Application
              </button>

              {showAppForm && (
                <div className="journey-app-form card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label className="capture-filter-label">Company *</label>
                      <input className="input" placeholder="Google, Amazon..." value={appForm.company} onChange={e => setAppForm(f => ({ ...f, company: e.target.value }))} /></div>
                    <div><label className="capture-filter-label">Role *</label>
                      <input className="input" placeholder="SDE Intern, SWE..." value={appForm.role} onChange={e => setAppForm(f => ({ ...f, role: e.target.value }))} /></div>
                    <div><label className="capture-filter-label">Type</label>
                      <select className="input" value={appForm.type} onChange={e => setAppForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="full-time">Full-Time</option><option value="internship">Internship</option>
                        <option value="contract">Contract</option><option value="freelance">Freelance</option>
                      </select></div>
                    <div><label className="capture-filter-label">Location</label>
                      <input className="input" placeholder="Remote, Bangalore..." value={appForm.location} onChange={e => setAppForm(f => ({ ...f, location: e.target.value }))} /></div>
                    <div><label className="capture-filter-label">URL</label>
                      <input className="input" placeholder="Job posting link" value={appForm.url} onChange={e => setAppForm(f => ({ ...f, url: e.target.value }))} /></div>
                    <div><label className="capture-filter-label">Salary</label>
                      <input className="input" placeholder="Expected/offered" value={appForm.salary} onChange={e => setAppForm(f => ({ ...f, salary: e.target.value }))} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={createApp}>Save</button>
                    <button className="btn btn-secondary" onClick={() => setShowAppForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {apps.length === 0 ? (
                <div className="capture-empty-state">
                  <Briefcase size={56} strokeWidth={1} /><h3>No applications yet</h3>
                  <p>Track your job applications and interview pipeline</p>
                </div>
              ) : (
                <div className="journey-apps-grid">
                  {apps.map(app => (
                    <div key={app._id} className="app-card">
                      <div className="app-card-header">
                        <div><Building2 size={16} /><strong>{app.company}</strong></div>
                        <span className="app-status-badge" style={{ color: statusColors[app.status], borderColor: statusColors[app.status] }}>
                          {statusLabels[app.status]}
                        </span>
                      </div>
                      <div className="app-card-role">{app.role}</div>
                      <div className="app-card-meta">
                        {app.location && <span>📍 {app.location}</span>}
                        {app.salary && <span>💰 {app.salary}</span>}
                        {app.type !== 'full-time' && <span className="badge">{app.type}</span>}
                      </div>
                      {app.url && <a href={app.url} target="_blank" rel="noopener" className="app-card-link"><ExternalLink size={12} /> View Posting</a>}
                      {/* Timeline */}
                      {app.timeline?.length > 0 && (
                        <div className="app-timeline">
                          {app.timeline.slice(-3).map((ev, i) => (
                            <div key={i} className="app-timeline-item">
                              <div className="app-timeline-dot" />
                              <span>{ev.event}</span>
                              <span className="app-timeline-date">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Status pipeline */}
                      <div className="app-pipeline">
                        {statusOrder.slice(0, 7).map(s => (
                          <button key={s} className={`app-pipeline-step ${app.status === s ? 'active' : ''} ${statusOrder.indexOf(app.status) > statusOrder.indexOf(s) ? 'passed' : ''}`}
                            onClick={() => updateAppStatus(app._id, s)} title={statusLabels[s]} style={{ '--step-color': statusColors[s] }} />
                        ))}
                      </div>
                      <button className="icon-btn" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', opacity: 0 }} onClick={() => deleteApp(app._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS TAB ═══ */}
          {tab === 'analytics' && analytics && (
            <AnalyticsPanel data={analytics} />
          )}
        </>
      )}
    </div>
  );
}

function AnalyticsPanel({ data }) {
  const { heatmap, weeklyData, categoryData, pipeline, counts, roadmapSummaries, streak } = data;
  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

  // Heatmap
  const heatmapEntries = Object.entries(heatmap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxActivity = Math.max(...Object.values(heatmap), 1);

  return (
    <div className="analytics-grid">
      {/* Top Stats */}
      <div className="analytics-stats-row">
        {[
          { label: 'Activity Streak', value: `${streak} days`, icon: '' },
          { label: 'Study Hours', value: `${counts.totalStudyHours}h`, icon: '' },
          { label: 'Tasks Done', value: `${counts.tasksDone}/${counts.tasks}`, icon: '' },
          { label: 'Active Roadmaps', value: counts.roadmapsActive, icon: '' },
          { label: 'Applications', value: counts.applications, icon: '' },
          { label: 'Files Stored', value: counts.files, icon: '' },
        ].map((s, i) => (
          <div key={i} className="analytics-stat-card">
            <span className="analytics-stat-icon">{s.icon}</span>
            <span className="analytics-stat-value">{s.value}</span>
            <span className="analytics-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Activity Heatmap */}
      <div className="card analytics-heatmap-card">
        <h3 className="card-title">Activity Heatmap — Last 90 Days</h3>
        <div className="analytics-heatmap">
          {heatmapEntries.map(([date, count]) => (
            <div key={date} className="heatmap-cell" title={`${date}: ${count} actions`}
              style={{ opacity: count === 0 ? 0.1 : 0.2 + (count / maxActivity) * 0.8, background: count > 0 ? '#22c55e' : 'var(--border-light)' }} />
          ))}
        </div>
      </div>

      {/* Weekly Progress + Category */}
      <div className="analytics-charts-row">
        <div className="card">
          <h3 className="card-title">Weekly Task Completion</h3>
          <div className="analytics-bars">
            {weeklyData.map((w, i) => (
              <div key={i} className="analytics-bar-group">
                <div className="analytics-bar-container">
                  <div className="analytics-bar" style={{ height: `${w.total > 0 ? (w.done / w.total) * 100 : 0}%`, background: '#22c55e' }} />
                </div>
                <span className="analytics-bar-label">{w.week}</span>
                <span className="analytics-bar-value">{w.done}/{w.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Application Pipeline</h3>
          {Object.keys(pipeline).length > 0 ? (
            <div className="analytics-pipeline">
              {Object.entries(pipeline).map(([status, count]) => (
                <div key={status} className="analytics-pipeline-row">
                  <span className="analytics-pipeline-label" style={{ color: statusColors[status] }}>
                    {statusLabels[status] || status}
                  </span>
                  <div className="analytics-pipeline-bar">
                    <div style={{ width: `${(count / Math.max(...Object.values(pipeline))) * 100}%`, background: statusColors[status], height: '100%', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }} />
                  </div>
                  <span className="analytics-pipeline-count">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No applications yet</p>
          )}
        </div>
      </div>

      {/* Roadmap Progress */}
      {roadmapSummaries.length > 0 && (
        <div className="card">
          <h3 className="card-title">Active Roadmap Progress</h3>
          <div className="analytics-roadmap-bars">
            {roadmapSummaries.map(r => (
              <div key={r._id} className="analytics-roadmap-row">
                <span>{categoryEmojis[r.category]} {r.title}</span>
                <div className="analytics-roadmap-bar">
                  <div style={{ width: `${r.progress}%`, background: categoryColors[r.category], height: '100%', borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }} />
                </div>
                <span className="analytics-roadmap-pct">{r.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
