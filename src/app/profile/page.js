'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useSession } from 'next-auth/react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { User, Mail, Calendar, Flame, BookOpen, HelpCircle, Clock, Award, Save, Lock, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const toast = useToast();

  const [nameInput, setNameInput] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setNameInput(data.data.name);
        }
      } catch (err) {
        toast.error('Failed to load profile');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSaveName() {
    try {
      const res = await fetch('/api/user/profile', {
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
      const res = await fetch('/api/user/profile', {
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
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <SkeletonCard height="200px" />
        <div style={{ marginTop: '1.5rem' }}><SkeletonCard height="150px" /></div>
      </div>
    );
  }

  if (!profile) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Failed to load profile.</div>;

  const formatMinutes = (min) => {
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your account, stats, and achievements.</p>
      </header>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'var(--bg-accent)', border: '2px solid var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800,
          }}>
            {profile.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ maxWidth: '300px' }} />
                <button className="btn btn-primary" onClick={handleSaveName}><Save size={16} /></button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setNameInput(profile.name); }}>Cancel</button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {profile.name}
                  <button onClick={() => setEditing(true)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '0.25rem' }}>
                    <User size={14} />
                  </button>
                </h2>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={14} /> {profile.email}</span>
              <span className="badge">{profile.role}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={14} /> Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <StatItem icon={<Flame size={18} />} value={profile.streak || 0} label="Day Streak" />
          <StatItem icon={<BookOpen size={18} />} value={profile.totalExams || 0} label="Exams Taken" />
          <StatItem icon={<HelpCircle size={18} />} value={profile.questionsAnswered || 0} label="Questions" />
          <StatItem icon={<Clock size={18} />} value={formatMinutes(profile.totalStudyMinutes || 0)} label="Study Time" />
        </div>
      </div>

      {/* Achievements */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} /> Achievements
        </h3>
        {profile.achievements?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {profile.achievements.map((a) => (
              <div key={a.id} style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No achievements yet. Keep practicing to unlock badges!</p>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} /> Security
        </h3>
        {changingPassword ? (
          <div style={{ maxWidth: '400px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Current Password</label>
              <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>New Password</label>
              <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirm New Password</label>
              <input type={showPasswords ? 'text' : 'password'} className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => { setChangingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleChangePassword}>Change Password</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setChangingPassword(true)}>Change Password</button>
        )}
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.75rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
