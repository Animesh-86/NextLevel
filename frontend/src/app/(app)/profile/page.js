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
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Glass Header Banner */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <span className="badge badge-stark">Profile & Settings</span>
          </div>
          <div style={{ position: 'absolute', top: 'var(--space-lg)', right: 'var(--space-lg)', display: 'flex', gap: '8px' }}>
            <button
              className="btn"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setChangingPassword(true)}
            >
              <Lock size={14} style={{ marginRight: '6px' }} /> Change Password
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: 'rgb(255,150,150)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)',
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
                  <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onClick={() => { setEditing(false); setNameInput(profile.name); }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>{profile.name}</h1>
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
      <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Level {profile.level || 1}</h2>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{profile.xp || 0} / {(profile.level || 1) * 100} XP</span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-accent)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((profile.xp || 0) % 100)}%`, background: 'var(--brand)', transition: 'width 0.3s' }} />
        </div>
      </section>

      {/* Minimal Stats Row */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '24px', 
        padding: '12px 20px', background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Day Streak: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{profile.streak || 0}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exams Taken: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{profile.totalExams || 0}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Questions: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{profile.questionsAnswered || 0}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Study Time: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMinutes(profile.totalStudyMinutes || 0)}</strong></span>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 'var(--space-md)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Activity Heatmap */}
          {analytics?.heatmap && (
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Activity</h2>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>90 days</span>
                </div>
                <Link href="/journey?tab=analytics" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  Analytics <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(30, 1fr)', 
                gap: '4px',
                background: 'var(--bg-surface)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                {heatmapDays.map(({ date, count }) => (
                  <div
                    key={date}
                    title={`${date}: ${count} activities`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '2px',
                      background: count > 0 ? `rgba(180, 255, 100, ${0.25 + (count / heatmapMax) * 0.75})` : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: count > 0 ? `0 0 10px rgba(180, 255, 100, ${(count / heatmapMax) * 0.5})` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* New Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', flex: 1 }}>
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <BarChart3 size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subject Mastery</h2>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <SubjectHeatmap data={analytics?.categoryData || []} />
              </div>
            </section>

            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <PieChartIcon size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Time Distribution</h2>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <TimeDistributionPie data={analytics?.timeDistribution || []} />
              </div>
            </section>
          </div>

        </div>

        {/* Categories Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <BookOpen size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Custom Categories</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['Work', 'Personal', 'Education', 'Finance', 'Health', 'Projects', 'Notes', 'Other'].map(cat => (
                  <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                    {cat} (Default)
                  </span>
                ))}
                {(profile.customCategories || []).map((cat, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(180,255,100,0.1)', color: 'var(--brand)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: '1px solid rgba(180,255,100,0.2)' }}>
                    {cat}
                    <button
                      className="icon-btn"
                      style={{ padding: 0, marginLeft: '4px', opacity: 0.7 }}
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
                <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', alignSelf: 'flex-start' }} onClick={() => setShowAddCat(true)}>
                  + Add Custom Category
                </button>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section className="glass-panel" style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <Award size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Achievements</h2>
            </div>
            {profile.achievements?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                {profile.achievements.map((a) => (
                  <div key={a.id} style={{
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%', color: 'var(--brand)' }}>{a.icon ? <span>{a.icon}</span> : <Award size={24} />}</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-lg) 0', color: 'var(--text-muted)' }}>
                <Award size={24} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem' }}>No achievements yet. Keep practicing!</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Change Password Modal */}
      {changingPassword && (
        <div className="dialog-overlay" onClick={() => setChangingPassword(false)}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="capture-modal-header">
              <h2 className="capture-modal-title">Change Password</h2>
              <button className="icon-btn" onClick={() => setChangingPassword(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="capture-form" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} style={{ width: '100%', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ width: '100%', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ width: '100%', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="btn" style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onClick={() => { setChangingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleChangePassword}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
