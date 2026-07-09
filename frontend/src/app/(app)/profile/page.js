'use client';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import { useSession, signOut } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { User, Mail, Calendar, Flame, BookOpen, HelpCircle, Clock, Award, Save, Lock, Eye, EyeOff, BarChart3, ChevronRight, LogOut, PieChart as PieChartIcon, X } from 'lucide-react';
import Link from 'next/link';
import SubjectHeatmap from '@/components/charts/SubjectHeatmap';
import TimeDistributionPie from '@/components/charts/TimeDistributionPie';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const toast = useToast();

  const [nameInput, setNameInput] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          apiFetch('/api/user/profile').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false }))
        ]);
        
        if (profileRes.success) {
          setProfile(profileRes.data);
          setNameInput(profileRes.data.name);
        } else {
          toast.error('Failed to load profile');
        }

        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        toast.error('Failed to load data');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const heatmapDays = useMemo(() => {
    if (!analytics?.heatmap) return [];
    const days = [];
    const today = new Date();
    const hmap = analytics.heatmap || {};
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: hmap[dateStr] || 0 });
    }
    return days;
  }, [analytics?.heatmap]);

  const heatmapMax = useMemo(
    () => Math.max(...Object.values(analytics?.heatmap || {}), 1),
    [analytics?.heatmap]
  );

  async function handleSaveName() {
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Name updated');
        setProfile({ ...profile, name: nameInput });
        setEditing(false);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to update');
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed');
        setChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to change password');
    }
  }

  if (loading) {
    return (
      <div className="dash-page">
        <SkeletonCard height="200px" />
        <SkeletonCard height="150px" />
      </div>
    );
  }

  if (!profile) return <div className="dash-empty-mini">Failed to load profile.</div>;

  const formatMinutes = (min) => {
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  return (
    <div className="dash-page">
      <header className="dash-hero-premium">
        <div className="dash-hero-grid" aria-hidden />
        <div className="dash-hero-inner">
          <div className="dash-hero-top">
            <span className="dash-date-pill">Profile & Settings</span>
            <span className="dash-streak-pill">{profile.role || 'USER'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)'
            }}>
              {profile.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            
            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ maxWidth: '300px' }} />
                  <button className="btn btn-primary" onClick={handleSaveName}><Save size={16} /></button>
                  <button className="btn btn-secondary" onClick={() => { setEditing(false); setNameInput(profile.name); }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h1 className="dash-hero-display" style={{ marginBottom: 0 }}>{profile.name}</h1>
                  <button onClick={() => setEditing(true)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '0.5rem' }}>
                    <User size={16} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={15} /> {profile.email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} /> Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Level & XP Progress */}
      <section className="dash-panel">
        <div className="dash-panel-head" style={{ marginBottom: '1rem' }}>
          <div className="dash-panel-title-group">
            <Award size={16} />
            <h2>Level {profile.level || 1}</h2>
          </div>
          <span className="dash-roadmap-pct">{profile.xp || 0} / {(profile.level || 1) * 100} XP</span>
        </div>
        <div className="dash-roadmap-bar" style={{ height: '10px' }}>
          <div className="dash-roadmap-fill" style={{ width: `${((profile.xp || 0) % 100)}%` }} />
        </div>
      </section>

      {/* Quick Stats Grid */}
      <div className="dash-metrics-grid">
        <div className="dash-metric">
          <div className="dash-metric-icon"><Flame size={18} strokeWidth={1.75} /></div>
          <div className="dash-metric-body">
            <span className="dash-metric-value">{profile.streak || 0}</span>
            <span className="dash-metric-label">Day Streak</span>
          </div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-icon"><BookOpen size={18} strokeWidth={1.75} /></div>
          <div className="dash-metric-body">
            <span className="dash-metric-value">{profile.totalExams || 0}</span>
            <span className="dash-metric-label">Exams Taken</span>
          </div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-icon"><HelpCircle size={18} strokeWidth={1.75} /></div>
          <div className="dash-metric-body">
            <span className="dash-metric-value">{profile.questionsAnswered || 0}</span>
            <span className="dash-metric-label">Questions</span>
          </div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-icon"><Clock size={18} strokeWidth={1.75} /></div>
          <div className="dash-metric-body">
            <span className="dash-metric-value">{formatMinutes(profile.totalStudyMinutes || 0)}</span>
            <span className="dash-metric-label">Study Time</span>
          </div>
        </div>
      </div>

      <div className="dash-bento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Activity Heatmap */}
          {analytics?.heatmap && (
            <section className="dash-panel dash-panel-heatmap">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <BarChart3 size={16} />
                  <h2>Activity</h2>
                  <span className="dash-date-pill">90 days</span>
                </div>
                <Link href="/journey?tab=analytics" className="dash-panel-link">
                  Analytics <ChevronRight size={14} />
                </Link>
              </div>
              <div className="dash-heatmap-premium">
                {heatmapDays.map(({ date, count }) => (
                  <div
                    key={date}
                    className={`heatmap-cell-premium ${count > 0 ? 'active' : ''}`}
                    title={`${date}: ${count} activities`}
                    style={{
                      '--intensity': count === 0 ? 0 : 0.25 + (count / heatmapMax) * 0.75,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* New Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <BarChart3 size={16} />
                  <h2>Subject Mastery</h2>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <SubjectHeatmap data={analytics?.categoryData || []} />
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title-group">
                  <PieChartIcon size={16} />
                  <h2>Time Distribution</h2>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <TimeDistributionPie data={analytics?.timeDistribution || []} />
              </div>
            </section>
          </div>

          {/* Achievements */}
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title-group">
                <Award size={16} />
                <h2>Achievements</h2>
              </div>
            </div>
            {profile.achievements?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {profile.achievements.map((a) => (
                  <div key={a.id} style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-empty-mini">
                <p>No achievements yet. Keep practicing to unlock badges!</p>
              </div>
            )}
          </section>
        </div>

        {/* Categories Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title-group">
                <BookOpen size={16} />
                <h2>Custom Categories</h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['Work', 'Personal', 'Education', 'Finance', 'Health', 'Projects', 'Notes', 'Other'].map(cat => (
                  <span key={cat} className="capture-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7 }}>
                    {cat} (Default)
                  </span>
                ))}
                {(profile.customCategories || []).map((cat, idx) => (
                  <span key={idx} className="capture-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--primary)' }}>
                    {cat}
                    <button
                      className="icon-btn"
                      style={{ padding: 0 }}
                      onClick={async () => {
                        const cats = profile.customCategories.filter((_, i) => i !== idx);
                        setProfile({ ...profile, customCategories: cats });
                        await apiFetch('/api/user/profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customCategories: cats })
                        });
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              
              {showAddCat ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input"
                    placeholder="New category..."
                    autoFocus
                    onBlur={() => setShowAddCat(false)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Escape') setShowAddCat(false);
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const newCat = e.target.value.trim();
                        e.target.value = '';
                        const cats = [...(profile.customCategories || []), newCat];
                        setProfile({ ...profile, customCategories: cats });
                        await apiFetch('/api/user/profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customCategories: cats })
                        });
                        toast.success('Category added');
                        setShowAddCat(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => setShowAddCat(true)} style={{ alignSelf: 'flex-start' }}>
                  + Add Custom Category
                </button>
              )}
            </div>
          </section>

          {/* Security Panel */}
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title-group">
                <Lock size={16} />
                <h2>Security</h2>
              </div>
            </div>
            {changingPassword ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirm New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setChangingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangePassword}>Save</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setChangingPassword(true)}>Change Password</button>
            )}
          </section>

          <section className="dash-panel" style={{ marginTop: '2rem' }}>
            <div className="dash-panel-head">
              <div className="dash-panel-title-group">
                <LogOut size={16} />
                <h2>Sign Out</h2>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              You will be returned to the login screen.
            </p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'rgba(255,100,100,0.3)', color: 'rgb(255,150,150)' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign Out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
