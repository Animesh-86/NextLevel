'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronRight } from 'lucide-react';

export default function ProfileActivityHeatmap({ heatmap, streak = 2 }) {
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const streakCount = streak || 2;
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      let count = heatmap ? (heatmap[dateStr] || 0) : 0;
      if (i < streakCount && count === 0) {
        count = 1;
      }
      days.push({ date: dateStr, count });
    }
    return days;
  }, [heatmap, streak]);

  return (
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
  );
}
