'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Target, Filter, ChevronRight, Award } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [page]);

  async function fetchResults() {
    try {
      const res = await fetch(`/api/results?page=${page}&limit=15`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
    setLoading(false);
  }

  // Summary stats
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const avgScore = total > 0 ? Math.round(results.reduce((s, r) => s + r.scorePercent, 0) / total) : 0;
  const bestScore = total > 0 ? Math.max(...results.map(r => r.scorePercent)) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Exam Results</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View your performance history and detailed analysis.</p>
      </header>

      {/* Summary Cards */}
      {!loading && total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pagination?.total || total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Exams</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{avgScore}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Score</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{bestScore}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Best Score</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{total > 0 ? Math.round((passed / total) * 100) : 0}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</div>
          </div>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} height="80px" />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No results yet"
          message="Complete your first exam to see your results here."
          actionLabel="Take a Test"
          onAction={() => window.location.href = '/test'}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((result) => (
              <Link
                key={result._id}
                href={`/results/${result._id}`}
                className="card result-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: result.passed ? 'var(--bg-accent)' : 'var(--bg-surface)',
                    border: `1px solid ${result.passed ? 'var(--border-stark)' : 'var(--border-light)'}`,
                  }}>
                    {result.passed ? <Award size={22} /> : <Target size={22} style={{ opacity: 0.5 }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {result.examId?.title || 'Exam'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>{result.correctCount}/{result.totalCount} correct</span>
                      {result.timeTaken > 0 && <span>{Math.round(result.timeTaken / 60)}m</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{result.scorePercent}%</span>
                  <span className={`badge ${result.passed ? 'badge-stark' : ''}`}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
