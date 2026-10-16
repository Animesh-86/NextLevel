'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Target, Award, Trash2, ArrowRight, CheckCircle2, XCircle, Search } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api';

export default function ExamResultsHistory({ onTakeTest }) {
  const toast = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResults = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/results?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success && data.data) {
        setResults(data.data.data || []);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
    setLoading(false);
  }, [page]);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const id = deleteTarget.id || deleteTarget._id;
    try {
      const res = await apiFetch(`/api/results/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Exam result deleted successfully');
        setDeleteTarget(null);
        fetchResults();
      } else {
        toast.error(data.error || 'Failed to delete result');
      }
    } catch (err) {
      toast.error('Failed to delete result');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Summary stats
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const avgScore = total > 0 ? Math.round(results.reduce((s, r) => s + (r.scorePercent || 0), 0) / total) : 0;
  const bestScore = total > 0 ? Math.round(Math.max(...results.map(r => r.scorePercent || 0))) : 0;

  const filteredResults = results.filter(r => {
    const title = (r.exam?.title || r.title || 'Exam').toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this exam result?"
        message="This will permanently delete this exam result and its performance history. This action cannot be undone."
        confirmText={deleting ? "Deleting..." : "Delete Result"}
        danger={true}
      />

      {/* Summary Cards */}
      {!loading && total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pagination?.total || total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Total Exams</div>
          </div>
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: avgScore >= 70 ? 'var(--brand-primary, #6366f1)' : 'var(--text-primary)' }}>{avgScore}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Avg Score</div>
          </div>
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success, #10b981)' }}>{bestScore}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Best Score</div>
          </div>
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent, #f5a623)' }}>{total > 0 ? Math.round((passed / total) * 100) : 0}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Pass Rate</div>
          </div>
        </div>
      )}

      {/* Controls: Search & Filter */}
      {!loading && total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            width: '100%',
            maxWidth: '320px'
          }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by exam title..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
          </div>

          <button
            onClick={onTakeTest}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            + Take New Test
          </button>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} height="80px" />)}
        </div>
      ) : filteredResults.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={searchQuery ? "No matching exam results" : "No results yet"}
          message={searchQuery ? "Try a different search query" : "Complete your first exam to view your test scorecards and analytics."}
          actionLabel="Take a Test"
          onAction={onTakeTest}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredResults.map((result) => {
            const resultId = result.id || result._id;
            const isPassed = result.passed;
            const score = Math.round(result.scorePercent || 0);
            const dateStr = result.createdAt
              ? new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            return (
              <div
                key={resultId}
                className="card glass-panel"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.1rem 1.25rem',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    flexShrink: 0
                  }}>
                    {isPassed ? (
                      <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                    ) : (
                      <XCircle size={20} style={{ color: '#ef4444' }} />
                    )}
                  </div>

                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {result.exam?.title || result.title || 'Exam'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {dateStr}
                      </span>
                      <span>•</span>
                      <span>{result.totalCount != null ? result.totalCount : (result.totalQuestions || result.answers?.length || 0)} Questions</span>
                      <span>•</span>
                      <span style={{ color: isPassed ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {isPassed ? 'Passed' : 'Needs Practice'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isPassed ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-geist, monospace)'
                    }}>
                      {score}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                  </div>

                  <Link
                    href={`/results/${resultId}`}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    View Scorecard <ArrowRight size={14} />
                  </Link>

                  <button
                    onClick={() => setDeleteTarget(result)}
                    className="icon-btn"
                    style={{ color: 'var(--text-muted)', padding: '6px' }}
                    title="Delete result"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
