'use client';
import Link from 'next/link';
import { Sparkles, Clock } from 'lucide-react';

export default function DashboardBriefingRow({ digest, focusStats, userRooms }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1rem' }}>
      {/* Left: Daily Briefing Card */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            <Sparkles size={13} style={{ color: 'var(--text-muted)' }} />
            <span>DAILY BRIEFING</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, margin: '0 0 0.5rem 0' }}>
            {digest?.message ? digest.message.split('.')[0] + '.' : 'Keep your streak alive. Add one small task today to build momentum.'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
            {digest?.message && digest.message.includes('.') 
              ? digest.message.split('.').slice(1).join('.').trim() || 'Nothing is planned yet, so the quickest win is a plan for the day.'
              : 'Nothing is planned yet, so the quickest win is a plan for the day.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link 
            href="/planner" 
            className="dash-btn-primary"
            style={{ 
              background: 'var(--btn-bg)', 
              color: 'var(--btn-text)', 
              fontWeight: 700, 
              fontSize: '0.84rem', 
              padding: '0.55rem 1.15rem', 
              borderRadius: '8px', 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            Plan my day
          </Link>
          <Link 
            href={userRooms.length > 0 ? `/rooms/${userRooms[0].id}` : '/rooms'} 
            className="dash-btn-ghost"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-strong)', 
              color: 'var(--text)', 
              fontWeight: 600, 
              fontSize: '0.84rem', 
              padding: '0.55rem 1.15rem', 
              borderRadius: '8px', 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Start 25m focus</span>
          </Link>
        </div>
      </div>

      {/* Right: Focus Today Card */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '16px', 
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Circular Progress Ring */}
        <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
            <circle 
              cx="35" cy="35" r="28" 
              stroke="var(--surface-2)" 
              strokeWidth="5" 
              fill="none" 
            />
            <circle 
              cx="35" cy="35" r="28" 
              stroke="var(--amber)" 
              strokeWidth="5" 
              fill="none" 
              strokeDasharray={175.9} 
              strokeDashoffset={175.9 - (175.9 * Math.min(1, (focusStats.minutes || 0) / 25))} 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
            {focusStats.minutes}m
          </span>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            FOCUS TODAY
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
            {focusStats.minutes} of 25 min
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {focusStats.sessions} {focusStats.sessions === 1 ? 'session' : 'sessions'} so far
          </span>
          <Link 
            href={userRooms.length > 0 ? `/rooms/${userRooms[0].id}` : '/rooms'} 
            className="dash-link"
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Open Focus Timer
          </Link>
        </div>
      </div>
    </div>
  );
}
