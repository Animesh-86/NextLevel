'use client';
import Link from 'next/link';
import { Flame, Award, Target } from 'lucide-react';

export default function DashboardHeader({
  dateFormatted,
  greeting,
  userName,
  streak,
  profile,
}) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          {dateFormatted}
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: 'var(--text)' }}>
          {greeting}, {userName}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Flame Streak Pill */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '7px', 
          background: 'var(--amber-tint)', 
          border: '1px solid var(--amber-border)', 
          color: 'var(--amber)', 
          padding: '6px 14px', 
          borderRadius: '999px',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          <Flame size={15} style={{ color: 'var(--amber)' }} />
          <span>{streak}-day streak</span>
        </div>

        {/* Level Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          <Award size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Level {profile?.level || 1} • {profile?.xp || 55} XP</span>
        </div>

        {/* Practice Exam Button */}
        <Link
          href="/test"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.84rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <Target size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Practice Exam</span>
        </Link>
      </div>
    </header>
  );
}
