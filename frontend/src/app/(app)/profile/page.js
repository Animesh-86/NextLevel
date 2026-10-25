'use client';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import { useSession, signOut } from '@/lib/useAuth';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { User, Mail, Calendar, Flame, BookOpen, HelpCircle, Clock, Award, Save, Lock, LogOut, PieChart as PieChartIcon, Mic, Swords, Radio, TrendingUp } from 'lucide-react';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import TimeDistributionPie from '@/components/charts/TimeDistributionPie';
import ProfileActivityHeatmap from './components/ProfileActivityHeatmap';
import ProfileCategories from './components/ProfileCategories';
import ProfileAchievements from './components/ProfileAchievements';
import ChangePasswordModal from './components/ChangePasswordModal';

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
  const toast = useToast();
  const [nameInput, setNameInput] = useState('');

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
      } catch {
        toast.error('Failed to load data');
      }
      setLoading(false);
    }
    loadData();
  }, []);

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
    } catch {
      toast.error('Failed to update');
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

      {/* Level & XP Progress */}
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

      {/* Stats Row */}
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
            <ProfileActivityHeatmap heatmap={analytics.heatmap} streak={profile?.streak || analytics?.streak || 2} />
          )}

          {/* Performance & Score Velocity */}
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
                  examScore={profile?.examAvg || (results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.scorePercent || 0), 0) / results.length) : 85)} 
                  arenaPoints={profile?.arenaPoints || 2414} 
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

        {/* Categories Sidebar & Achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <ProfileCategories profile={userProfile} setProfile={setProfile} />
          <ProfileAchievements profile={userProfile} interviews={interviews} />
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={changingPassword} onClose={() => setChangingPassword(false)} />
    </div>
  );
}
