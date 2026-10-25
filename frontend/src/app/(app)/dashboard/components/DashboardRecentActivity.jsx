'use client';
import Link from 'next/link';
import { Activity, Target, Mic, ArrowRight, ChevronRight } from 'lucide-react';

export default function DashboardRecentActivity({
  activityFilter,
  setActivityFilter,
  filteredActivity,
  getScoreColor,
  formatRelativeTime,
}) {
  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: '1px solid var(--border)', 
      borderRadius: '16px', 
      padding: '1.35rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '320px'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              RECENT ACTIVITY & PERFORMANCE
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {['all', 'exams', 'interviews'].map(f => (
              <button
                key={f}
                onClick={() => setActivityFilter(f)}
                style={{
                  background: activityFilter === f ? 'var(--surface)' : 'transparent',
                  border: activityFilter === f ? '1px solid var(--border-strong)' : 'none',
                  color: activityFilter === f ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {f === 'all' ? 'All' : f === 'exams' ? 'Exams' : 'Interviews'}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        {filteredActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredActivity.slice(0, 4).map(item => {
              const isExam = item.type === 'exam';
              const scoreColor = getScoreColor(item.score);
              
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px', 
                    padding: '0.8rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)',
                      flexShrink: 0
                    }}>
                      {isExam ? <Target size={16} /> : <Mic size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </span>
                        {item.verdict && (
                          <span style={{ 
                            background: 'var(--surface)', 
                            border: '1px solid var(--border)',
                            color: item.verdict.includes('HIRE') ? 'var(--green)' : 'var(--red)', 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {item.verdict.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.type === 'exam' 
                          ? `${item.correctCount != null && item.totalCount != null ? `${item.correctCount}/${item.totalCount} correct · ` : ''}${formatRelativeTime(item.createdAt)}`
                          : `${item.durationMinutes ? `${item.durationMinutes}m interview · ` : ''}${formatRelativeTime(item.createdAt)}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
                    {item.score != null && (
                      <div style={{ 
                        fontSize: '0.92rem', 
                        fontWeight: 800, 
                        color: scoreColor,
                        background: 'var(--surface)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)'
                      }}>
                        {item.score}%
                      </div>
                    )}
                    <Link 
                      href={item.link}
                      className="dash-link"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        padding: '5px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      <span>{isExam ? 'Review' : 'Scorecard'}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            padding: '2rem 1rem', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)',
            borderRadius: '12px', 
            textAlign: 'center', 
            color: 'var(--text-muted)', 
            fontSize: '0.85rem' 
          }}>
            <p style={{ margin: '0 0 1rem 0' }}>No recent evaluations found. Complete a practice exam or mock interview to track progress.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <Link href="/test" className="dash-btn-ghost" style={{ border: '1px solid var(--border-strong)', color: 'var(--text)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                Practice Exams
              </Link>
              <Link href="/interview" className="dash-btn-ghost" style={{ border: '1px solid var(--border-strong)', color: 'var(--text)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                AI Mock Interview
              </Link>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Showing latest assessments & mock rounds
        </span>
        <Link href="/profile" className="dash-link" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          View full learning profile <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
