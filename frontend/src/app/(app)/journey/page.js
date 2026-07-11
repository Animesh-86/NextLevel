'use client';
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { apiFetch } from '@/lib/api';
import {
  Map, Briefcase, BarChart3, Plus, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Clock, Trash2, Loader2, Play, Pause,
  ExternalLink, Building2, X
} from 'lucide-react';

const categoryColors = {
  work: '#fafafa', personal: '#dddddd', education: '#bbbbbb',
  finance: '#999999', health: '#777777', projects: '#555555',
  notes: '#333333', other: '#111111',
};
const categoryEmojis = {
  work: '', personal: '', education: '', finance: '',
  health: '', projects: '', notes: '', other: '',
};
const statusColors = {
  bookmarked: '#444444', applied: '#555555', screening: '#666666',
  technical: '#777777', onsite: '#888888', offer: '#aaaaaa',
  accepted: '#fafafa', rejected: '#555555', ghosted: '#333333',
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
    
    // Convert targetDate to Instant-compatible ISO string if possible
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

  const renderAppCard = (app) => (
    <div key={app.id || app._id} className="app-card">
      <div className="app-card-header">
        <div><Building2 size={16} /><strong>{app.company}</strong></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="app-status-badge" style={{ color: statusColors[app.status], borderColor: statusColors[app.status] }}>
            {statusLabels[app.status]}
          </span>
          <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} onClick={() => deleteApp(app.id || app._id)} title="Delete Application">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="app-card-role">{app.role}</div>
      <div className="app-card-meta">
        {app.location && <span>{app.location}</span>}
        {app.salary && <span>{app.salary}</span>}
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
              <span className="app-timeline-date">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          ))}
        </div>
      )}
      {/* Status pipeline */}
      <div className="app-pipeline">
        {statusOrder.slice(0, 7).map(s => (
          <button key={s} className={`app-pipeline-step ${app.status === s ? 'active' : ''} ${statusOrder.indexOf(app.status) > statusOrder.indexOf(s) ? 'passed' : ''}`}
            onClick={() => handleStatusChange(app.id || app._id, s)} title={statusLabels[s]} style={{ '--step-color': statusColors[s] }} />
        ))}
      </div>
      
      {/* Terminal states */}
      {app.status !== 'rejected' && app.status !== 'ghosted' && app.status !== 'accepted' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => handleStatusChange(app.id || app._id, 'rejected')}>
            Mark Rejected
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => handleStatusChange(app.id || app._id, 'ghosted')}>
            Ghosted
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0', color: '#10b981', borderColor: '#10b981' }} onClick={() => handleStatusChange(app.id || app._id, 'accepted')}>
            Accepted
          </button>
        </div>
      )}
      {(app.status === 'rejected' || app.status === 'ghosted') && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => handleStatusChange(app.id || app._id, 'applied')}>
            Revert Status
          </button>
        </div>
      )}
    </div>
  );

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
                          {r.milestones.map((m, mi) => {
                            const tasksDone = m.tasks.filter(t => t.done).length;
                            const total = m.tasks.length;
                            const pct = total > 0 ? Math.round((tasksDone / total) * 100) : (m.status === 'completed' ? 100 : 0);
                            return (
                              <div key={m._id} className={`roadmap-node ${m.status}`}>
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
                              <div key={m._id} className="roadmap-milestone">
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
                    {activeApps.map(app => renderAppCard(app))}
                  </div>
                  {showArchive && archiveApps.length > 0 && (
                    <div style={{ marginTop: '3rem' }}>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Archived (Rejected / Ghosted)</h3>
                      <div className="journey-apps-grid">
                        {archiveApps.map(app => renderAppCard(app))}
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
      {showRoadmapForm && (
        <div className="modal-overlay" onClick={() => setShowRoadmapForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Create Roadmap</h2>
              <button className="icon-btn" onClick={() => setShowRoadmapForm(false)}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label>Title</label>
                <input type="text" className="input" value={roadmapForm.title} onChange={e => setRoadmapForm({...roadmapForm, title: e.target.value})} placeholder="e.g. Learn System Design" />
              </div>
              
              <div>
                <label>Description (Optional)</label>
                <textarea className="input" value={roadmapForm.description} onChange={e => setRoadmapForm({...roadmapForm, description: e.target.value})} placeholder="What is the goal of this journey?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Category</label>
                  <select className="input" value={roadmapForm.category} onChange={e => setRoadmapForm({...roadmapForm, category: e.target.value})}>
                    {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label>Target Date</label>
                  <input type="date" className="input" value={roadmapForm.targetDate} onChange={e => setRoadmapForm({...roadmapForm, targetDate: e.target.value})} />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  Milestones
                  <button className="btn btn-secondary" onClick={() => {
                    const newMilestones = [...roadmapForm.milestones, { title: '', tasks: [{ title: '', done: false }] }];
                    setRoadmapForm({...roadmapForm, milestones: newMilestones});
                  }}><Plus size={14} /> Add Milestone</button>
                </h3>
                
                {roadmapForm.milestones.map((milestone, mIdx) => (
                  <div key={mIdx} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ margin: 0 }}>Milestone {mIdx + 1} Title</label>
                      {roadmapForm.milestones.length > 1 && (
                        <button className="icon-btn" onClick={() => {
                          const newM = [...roadmapForm.milestones];
                          newM.splice(mIdx, 1);
                          setRoadmapForm({...roadmapForm, milestones: newM});
                        }}><Trash2 size={14} style={{color: 'var(--text-error)'}} /></button>
                      )}
                    </div>
                    <input type="text" className="input" value={milestone.title} onChange={e => {
                      const newM = [...roadmapForm.milestones];
                      newM[mIdx].title = e.target.value;
                      setRoadmapForm({...roadmapForm, milestones: newM});
                    }} placeholder="e.g. Week 1: Fundamentals" style={{ marginBottom: '1rem' }} />

                    <label>Topics / Tasks</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {milestone.tasks.map((task, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" className="input" value={task.title} onChange={e => {
                            const newM = [...roadmapForm.milestones];
                            newM[mIdx].tasks[tIdx].title = e.target.value;
                            setRoadmapForm({...roadmapForm, milestones: newM});
                          }} placeholder="Task title" />
                          {milestone.tasks.length > 1 && (
                            <button className="btn btn-secondary" onClick={() => {
                              const newM = [...roadmapForm.milestones];
                              newM[mIdx].tasks.splice(tIdx, 1);
                              setRoadmapForm({...roadmapForm, milestones: newM});
                            }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                      <button className="btn btn-secondary" onClick={() => {
                        const newM = [...roadmapForm.milestones];
                        newM[mIdx].tasks.push({ title: '', done: false });
                        setRoadmapForm({...roadmapForm, milestones: newM});
                      }} style={{ width: 'fit-content' }}>+ Add Topic</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowRoadmapForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createRoadmap}>Create Journey</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectFlow.active && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            {!rejectFlow.completed ? (
              <>
                <div className="modal-header">
                  <h2>Application Rejected</h2>
                  <button className="icon-btn" onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}><X size={20} /></button>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sorry to hear that. Any notes on why it was rejected? (Optional)</p>
                  <textarea className="input" placeholder="e.g. They wanted more Python experience" value={rejectFlow.note} onChange={e => setRejectFlow(f => ({ ...f, note: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}>Cancel</button>
                  <button className="btn btn-secondary" onClick={() => {
                    updateAppStatus(rejectFlow.appId, 'rejected');
                    setRejectFlow(f => ({ ...f, completed: true }));
                  }}>Save without Note</button>
                  <button className="btn btn-primary" onClick={() => {
                    updateAppStatus(rejectFlow.appId, 'rejected', rejectFlow.note);
                    setRejectFlow(f => ({ ...f, completed: true }));
                  }}>Save Note</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Keep Pushing!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Every 'No' brings you one step closer to a 'Yes'. Your next opportunity is out there.</p>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}>Got it</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel({ data }) {
  const { heatmap, weeklyData, categoryData, pipeline, counts, roadmapSummaries, streak } = data;

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
              style={{ opacity: count === 0 ? 0.08 : 0.2 + (count / maxActivity) * 0.8, background: count > 0 ? 'var(--text-primary)' : 'var(--border-light)' }} />
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
                  <div className="analytics-bar" style={{ height: `${w.total > 0 ? (w.done / w.total) * 100 : 0}%`, background: 'var(--text-primary)' }} />
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
