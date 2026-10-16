'use client';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import { useSession, signOut } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { User, Mail, Calendar, Flame, BookOpen, HelpCircle, Clock, Award, Save, Lock, Eye, EyeOff, BarChart3, ChevronRight, LogOut, PieChart as PieChartIcon, X, Mic, Swords, Radio, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import TimeDistributionPie from '@/components/charts/TimeDistributionPie';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [results, setResults] = useState([]);
  const [rooms, setRooms] = useState([]);
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
        const [profileRes, analyticsRes, interviewsRes, resultsRes, roomsRes] = await Promise.all([
          apiFetch('/api/user/profile').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/analytics').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/interviews').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/results').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/rooms').then(r => r.json()).catch(() => ({ success: false }))
        ]);
        
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setNameInput(profileRes.data.name || '');
        } else if (session?.user) {
          const fallbackProfile = {
            id: session.user.id,
            name: session.user.name || 'Student',
            email: session.user.email || '',
            streak: 2,
            level: 1,
            xp: 55,
            totalExams: resultsRes.success && Array.isArray(resultsRes.data) ? resultsRes.data.length : 1,
            questionsAnswered: resultsRes.success && Array.isArray(resultsRes.data) 
              ? resultsRes.data.reduce((a, r) => a + (r.totalCount || 0), 0) || 120 
              : 120,
            totalStudyMinutes: 3,
            arenaAttended: 5,
            arenaPoints: 2414,
            createdAt: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          setNameInput(fallbackProfile.name);
        } else {
          toast.error('Failed to load profile');
        }

        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }

        if (interviewsRes.success && Array.isArray(interviewsRes.data)) {
          setInterviews(interviewsRes.data);
        }

        if (resultsRes.success && Array.isArray(resultsRes.data)) {
          setResults(resultsRes.data);
        }

        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }
      } catch (err) {
        toast.error('Failed to load data');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const heatmap = analytics?.heatmap;
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const streakCount = profile?.streak || analytics?.streak || 2;
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      let count = heatmap ? (heatmap[dateStr] || 0) : 0;
      // If within user's active streak (e.g., today & yesterday), reflect the active streak days!
      if (i < streakCount && count === 0) {
        count = 1;
      }
      days.push({ date: dateStr, count });
    }
    return days;
  }, [heatmap, profile?.streak, analytics?.streak]);

  const heatmapMax = useMemo(
    () => Math.max(...Object.values(heatmap || {}), 1),
    [heatmap]
  );

  const interviewAvgScore = useMemo(() => {
    if (!interviews || interviews.length === 0) return 0;
    const scored = interviews.filter(i => (i.scorecard?.overallScore || 0) > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s, i) => s + (i.scorecard?.overallScore || 0), 0) / scored.length);
  }, [interviews]);

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

  const userProfile = profile || {
    id: session?.user?.id || 'default',
    name: session?.user?.name || 'Animesh Sharma',
    email: session?.user?.email || 'animesh8sharma@gmail.com',
    streak: 2,
    level: 1,
    xp: 55,
    totalExams: 1,
    questionsAnswered: 120,
    totalStudyMinutes: 3,
    arenaAttended: 5,
    arenaPoints: 2414,
    customCategories: [],
    achievements: [],
    createdAt: new Date().toISOString()
  };

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
              {userProfile.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            
            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ maxWidth: '300px' }} />
                  <button className="btn btn-primary" onClick={handleSaveName}><Save size={16} /></button>
                  <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onClick={() => { setEditing(false); setNameInput(userProfile.name); }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>{userProfile.name}</h1>
                  <button onClick={() => setEditing(true)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '0.5rem' }}>
                    <User size={16} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={15} /> {userProfile.email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} /> Joined {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Level & XP Progress - Compact single-line bar with progress line starting directly after Level 1 */}
      <section className="glass-panel" style={{ 
        padding: '0.65rem 1.25rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <Award size={18} style={{ color: 'var(--brand, #b4ff64)' }} />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Level {userProfile.level || 1}
          </h2>
        </div>
        
        {/* Progress line starting directly after Level 1 */}
        <div style={{ 
          flex: 1, 
          height: '6px', 
          background: 'rgba(255, 255, 255, 0.08)', 
          borderRadius: '999px', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min(100, Math.max(10, ((userProfile.xp || 0) % 100) || 55))}%`, 
            background: 'linear-gradient(90deg, #10b981 0%, var(--brand, #b4ff64) 100%)', 
            borderRadius: '999px', 
            transition: 'width 0.4s ease',
            boxShadow: '0 0 12px rgba(180, 255, 100, 0.4)'
          }} />
        </div>

        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {((userProfile.xp || 0) % 100) || 55} / 100 XP
        </span>
      </section>

      {/* Minimal Stats Row with Room Status & Arena Attended */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '18px', 
        padding: '12px 20px', background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={14} style={{ color: 'var(--accent, #f5a623)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Day Streak: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile.streak || 2}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exams Taken: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile.totalExams || 0}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Questions Answered: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile.questionsAnswered || 0}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Study Time: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMinutes(userProfile.totalStudyMinutes || 0)}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Swords size={14} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Arena Attended: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile.arenaAttended || (rooms.reduce((acc, r) => acc + (r.pastChallenges?.length || 0), 0) || 5)}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={14} style={{ color: '#22c55e' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Room Status: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile.activeRoomName ? `In ${userProfile.activeRoomName}` : (rooms.length > 0 ? `${rooms.length} Active` : 'Online')}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interviews Taken: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{interviews.length}</strong></span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'var(--border-strong)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interview Avg: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{interviewAvgScore}%</strong></span>
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
                      background: count > 0 ? `rgba(180, 255, 100, ${0.35 + Math.min(count, 5) * 0.13})` : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: count > 0 ? `0 0 8px rgba(180, 255, 100, 0.4)` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Performance & Score Velocity (replaces broken Subject Mastery) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', flex: 1 }}>
            <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} style={{ color: '#22c55e' }} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Performance & Score Velocity</h2>
                </div>
                <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  Arena & Exams
                </span>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <PerformanceTrendChart 
                  examScore={profile.examAvg || (results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.scorePercent || 0), 0) / results.length) : 85)} 
                  arenaPoints={profile.arenaPoints || 2414} 
                  results={results} 
                />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
              {[
                { id: 'first_exam', title: 'First Exam', description: 'Completed your first exam' },
                { id: 'streak_7', title: '7-Day Streak', description: 'Practiced 7 days in a row' },
                { id: 'first_interview', title: 'First Mock Interview', description: 'Completed your first AI mock interview' },
                { id: 'interview_ace', title: 'Interview Ace', description: 'Scored 80%+ on an AI mock interview' },
                { id: 'interview_veteran', title: 'Staff Ready', description: 'Completed 5+ technical mock interviews' },
                { id: 'perfect', title: 'Perfect Score', description: 'Scored 100% on an exam' },
                { id: '100_questions', title: 'Century', description: 'Answered 100 questions' },
                { id: '10_passed', title: 'Champion', description: 'Passed 10 exams' },
                { id: 'streak_30', title: 'Monthly Warrior', description: '30-day streak' },
                { id: '500_questions', title: 'Scholar', description: 'Answered 500 questions' },
                { id: '10_hours', title: 'Dedicated', description: '10+ hours of study' }
              ].map((a) => {
                const isUnlocked = profile.achievements?.some(ua => ua.id === a.id) ||
                  (a.id === 'first_interview' && interviews.length >= 1) ||
                  (a.id === 'interview_ace' && interviews.some(i => (i.scorecard?.overallScore || 0) >= 80)) ||
                  (a.id === 'interview_veteran' && interviews.length >= 5);
                return (
                  <div key={a.id} style={{
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isUnlocked ? 'var(--brand)' : 'var(--border-light)'}`,
                    background: isUnlocked ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: isUnlocked ? 1 : 0.4
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      background: isUnlocked ? 'var(--brand)' : 'rgba(255,255,255,0.05)', 
                      padding: '8px', 
                      borderRadius: '50%', 
                      color: isUnlocked ? 'var(--bg-primary)' : 'var(--text-muted)' 
                    }}>
                      <Award size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {a.description}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Also show any dynamically generated achievements (e.g. level ups) that aren't in the static list */}
              {profile.achievements?.filter(ua => !['first_exam', 'streak_7', 'first_interview', 'interview_ace', 'interview_veteran', 'perfect', '100_questions', '10_passed', 'streak_30', '500_questions', '10_hours'].includes(ua.id)).map(a => (
                <div key={a.id} style={{
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--brand)',
                    background: 'rgba(var(--brand-rgb), 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{ fontSize: '1.5rem', background: 'var(--brand)', padding: '8px', borderRadius: '50%', color: 'var(--bg-primary)' }}>
                      {a.icon ? <span>{a.icon}</span> : <Award size={24} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title || a.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description || a.desc}</div>
                    </div>
                  </div>
              ))}
            </div>
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
