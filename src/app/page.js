'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { BrainCircuit, BookOpen, Clock, Target, Play, Database, Trophy, Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { SkeletonCard } from '@/components/SkeletonLoader';

export default function InsightDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const userName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
            Welcome back, {userName}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here&apos;s your learning overview and analytics.</p>
        </div>
        {stats && stats.streak > 0 && (
          <div className="badge badge-stark" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Flame size={16} /> {stats.streak}-Day Streak
          </div>
        )}
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {loading ? (
          <>
            <SkeletonCard height="110px" />
            <SkeletonCard height="110px" />
            <SkeletonCard height="110px" />
            <SkeletonCard height="110px" />
          </>
        ) : (
          <>
            <StatCard label="Exams Completed" value={stats?.totalExamsTaken || 0} icon={<BookOpen size={22} />} />
            <StatCard label="Avg. Score" value={`${stats?.avgScore || 0}%`} icon={<Target size={22} />} highlight />
            <StatCard label="Need Review" value={stats?.needsReview || 0} icon={<Clock size={22} />} />
            <StatCard label="Question Bank" value={stats?.totalQuestions || 0} icon={<Database size={22} />} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }} className="dashboard-grid">
        {/* Skill Radar */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={20} /> Skill Radar
          </h2>
          <div style={{ flex: 1, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats?.radarData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.radarData}>
                  <PolarGrid stroke="var(--border-strong)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Proficiency" dataKey="A" stroke="var(--text-primary)" strokeWidth={2} fill="var(--text-primary)" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <BrainCircuit size={40} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Complete your first exam to see skill data</p>
              </div>
            )}
          </div>
        </section>

        {/* Weekly Progress */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} /> Recent Progress
          </h2>
          <div style={{ flex: 1, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats?.weeklyProgress?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.weeklyProgress} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--text-primary)" strokeWidth={2} dot={{ fill: 'var(--text-primary)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <TrendingUp size={40} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Complete exams to track your progress</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }} className="dashboard-grid">
        {/* Recent Activity */}
        <section className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} /> Recent Activity
          </h2>
          {stats?.recentActivity?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/results/${activity.id}`}
                  className="activity-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{activity.examTitle}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{activity.score}%</span>
                    <span className={`badge ${activity.passed ? 'badge-stark' : ''}`}>
                      {activity.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              <p>No exam history yet. Take your first test!</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <Link href="/test" className="btn btn-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={18} /> Start Focus Test</span>
              <span className="badge badge-stark">Simulation</span>
            </Link>

            <Link href="/test?mode=study" className="btn btn-secondary" style={{ width: '100%', padding: '1rem', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BrainCircuit size={18} /> Start Study Mode</span>
              <span className="badge">SRS</span>
            </Link>

            <Link href="/results" className="btn btn-secondary" style={{ width: '100%', padding: '1rem', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={18} /> View Results</span>
              <span className="badge">{stats?.totalExamsTaken || 0}</span>
            </Link>

            {/* Summary Card */}
            <div style={{ marginTop: 'auto', padding: '1.25rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.passRate || 0}%</span> pass rate</div>
                <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.bestScore || 0}%</span> best score</div>
                <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.examCount || 0}</span> exams</div>
                <div><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.totalQuestions || 0}</span> questions</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: highlight ? 'var(--text-primary)' : undefined }}>{value}</div>
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
    </div>
  );
}
