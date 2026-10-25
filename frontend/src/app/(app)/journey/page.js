'use client';
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { apiFetch } from '@/lib/api';
import {
  Map, Briefcase, BarChart3, Plus, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Trash2, Loader2, Play
} from 'lucide-react';
import {
  categoryColors, categoryEmojis, statusOrder
} from './components/journeyConstants';
import AnalyticsPanel from './components/AnalyticsPanel';
import CreateRoadmapModal from './components/CreateRoadmapModal';
import ApplicationCard from './components/ApplicationCard';
import ApplicationRejectModal from './components/ApplicationRejectModal';

export default function JourneyPage() {
  const [tab, setTab] = useState('roadmaps');
  const [roadmaps, setRoadmaps] = useState([]);
  const [apps, setApps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoadmapForm, setShowRoadmapForm] = useState(false);
  const [roadmapForm, setRoadmapForm] = useState({ 
    title: '', description: '', category: 'work', targetDate: '', 
    milestones: [{ title: '', tasks: [{ title: '', done: false }] }] 
  });
  const [showAppForm, setShowAppForm] = useState(false);
  const [expandedRoadmap, setExpandedRoadmap] = useState(null);
  const [appForm, setAppForm] = useState({ company: '', role: '', type: 'full-time', url: '', location: '', salary: '', notes: '' });
  const [rejectFlow, setRejectFlow] = useState({ active: false, appId: null, note: '', completed: false });
  const [showArchive, setShowArchive] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'roadmaps') {
        const r = await apiFetch('/api/roadmaps').then(res => res.json());
        if (r.success) setRoadmaps(r.data);
      } else if (tab === 'applications') {
        const r = await apiFetch('/api/applications').then(r => r.json());
        if (r.success) setApps(r.data);
      } else {
        const r = await apiFetch('/api/analytics').then(r => r.json());
        if (r.success) setAnalytics(r.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createRoadmap() {
    if (!roadmapForm.title || !roadmapForm.targetDate) return;
    
    const dateObj = new Date(roadmapForm.targetDate);
    const targetDateISO = isNaN(dateObj) ? new Date().toISOString() : dateObj.toISOString();

    const payload = {
      title: roadmapForm.title,
      description: roadmapForm.description,
      category: roadmapForm.category,
      targetDate: targetDateISO,
      milestones: roadmapForm.milestones
    };

    await apiFetch('/api/roadmaps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    setShowRoadmapForm(false);
    setRoadmapForm({ 
      title: '', description: '', category: 'work', targetDate: '', 
      milestones: [{ title: '', tasks: [{ title: '', done: false }] }] 
    });
    fetchData();
  }

  async function toggleTask(roadmapId, milestoneId, taskId) {
    await apiFetch(`/api/roadmaps/${roadmapId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleTask: { milestoneId, taskId } }),
    });
    fetchData();
  }

  async function deleteRoadmap(id) {
    await apiFetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function createApp() {
    if (!appForm.company || !appForm.role) return;
    await apiFetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appForm),
    });
    setShowAppForm(false);
    setAppForm({ company: '', role: '', type: 'full-time', url: '', location: '', salary: '', notes: '' });
    fetchData();
  }

  async function updateAppStatus(id, status, note = null) {
    const payload = { status };
    if (note) {
      payload.addEvent = { event: 'Status changed to ' + status, notes: note };
    }
    await apiFetch(`/api/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fetchData();
  }

  function handleStatusChange(id, status) {
    if (status === 'rejected') {
      setRejectFlow({ active: true, appId: id, note: '', completed: false });
    } else if (status === 'accepted') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      updateAppStatus(id, status);
    } else {
      updateAppStatus(id, status);
    }
  }

  async function deleteApp(id) {
    await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
    fetchData();
  }

  const activeApps = apps.filter(a => a.status !== 'rejected' && a.status !== 'ghosted');
  const archiveApps = apps.filter(a => a.status === 'rejected' || a.status === 'ghosted');

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
                <button className="btn btn-primary" onClick={() => setShowRoadmapForm(true)}>
                  <Plus size={16} /> Create Roadmap
                </button>
              </div>

              {roadmaps.length === 0 ? (
                <div className="capture-empty-state">
                  <Map size={56} strokeWidth={1} />
                  <h3>No roadmaps yet</h3>
                  <p>Start a learning roadmap by creating your own journey</p>
                </div>
              ) : (
                <div className="journey-roadmaps">
                  {roadmaps.map(r => {
                    const isExpanded = expandedRoadmap === (r.id || r._id);
                    return (
                      <div key={r.id || r._id} className="roadmap-card" style={{ borderLeftColor: categoryColors[r.category] || '#fff' }}>
                        <div className="roadmap-header" onClick={() => setExpandedRoadmap(isExpanded ? null : (r.id || r._id))}>
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
                          {r.milestones.map((m) => {
                            const tasksDone = m.tasks.filter(t => t.done).length;
                            const total = m.tasks.length;
                            return (
                              <div key={m._id || m.id} className={`roadmap-node ${m.status}`}>
                                <div className="roadmap-node-dot" style={{
                                  borderColor: m.status === 'completed' ? 'var(--text-primary)' : m.status === 'in-progress' ? 'var(--text-secondary)' : 'var(--border-strong)',
                                  background: m.status === 'completed' ? 'var(--text-primary)' : 'var(--bg-primary)',
                                }}>
                                  {m.status === 'completed' && <CheckCircle2 size={12} color="var(--text-inverse)" />}
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
                              <div key={m._id || m.id} className="roadmap-milestone">
                                <h4 className="roadmap-milestone-title">{m.title}</h4>
                                <div className="roadmap-tasks">
                                  {m.tasks.map(t => (
                                    <button key={t.id || t._id} className={`roadmap-task ${t.done ? 'done' : ''}`}
                                      onClick={() => toggleTask(r.id || r._id, m.id || m._id, t.id || t._id)}>
                                      {t.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                      <span>{t.title}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => deleteRoadmap(r.id || r._id)}>
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
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowAppForm(!showAppForm)}>
                  <Plus size={16} /> Add Application
                </button>
                {archiveApps.length > 0 && (
                  <button className="btn btn-secondary" onClick={() => setShowArchive(!showArchive)}>
                    {showArchive ? 'Hide Archived' : 'Show Archived'}
                  </button>
                )}
              </div>

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
                <>
                  <div className="journey-apps-grid">
                    {activeApps.map(app => (
                      <ApplicationCard key={app.id || app._id} app={app} onDelete={deleteApp} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                  {showArchive && archiveApps.length > 0 && (
                    <div style={{ marginTop: '3rem' }}>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Archived (Rejected / Ghosted)</h3>
                      <div className="journey-apps-grid">
                        {archiveApps.map(app => (
                          <ApplicationCard key={app.id || app._id} app={app} onDelete={deleteApp} onStatusChange={handleStatusChange} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS TAB ═══ */}
          {tab === 'analytics' && analytics && (
            <AnalyticsPanel data={analytics} />
          )}
        </>
      )}

      {/* ROADMAP MODAL */}
      <CreateRoadmapModal
        isOpen={showRoadmapForm}
        onClose={() => setShowRoadmapForm(false)}
        roadmapForm={roadmapForm}
        setRoadmapForm={setRoadmapForm}
        onSubmit={createRoadmap}
      />

      {/* REJECTION MODAL */}
      <ApplicationRejectModal
        rejectFlow={rejectFlow}
        setRejectFlow={setRejectFlow}
        onConfirmReject={updateAppStatus}
      />
    </div>
  );
}
