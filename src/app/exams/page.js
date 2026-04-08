'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { Plus, Edit2, Trash2, BookOpen, Clock, Target, Users } from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    passPercentage: 75,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch (err) {
      toast.error('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editingExam ? `/api/exams/${editingExam._id}` : '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingExam ? 'Exam updated' : 'Exam created');
        setShowForm(false);
        setEditingExam(null);
        setForm({ title: '', description: '', timeLimit: 60, passPercentage: 75 });
        fetchExams();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to save exam');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/exams/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Exam deleted');
        fetchExams();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete exam');
    }
    setDeleteTarget(null);
  }

  function startEdit(exam) {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      description: exam.description || '',
      timeLimit: exam.timeLimit,
      passPercentage: exam.passPercentage,
    });
    setShowForm(true);
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Exam Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create and manage exams for your question bank.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setEditingExam(null); setForm({ title: '', description: '', timeLimit: 60, passPercentage: 75 }); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Exam
        </button>
      </header>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
          <h3 className="card-title">{editingExam ? 'Edit Exam' : 'Create New Exam'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AWS Solutions Architect"
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this exam"
                  rows={2}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Time Limit (min)</label>
                <input
                  type="number"
                  className="input"
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value) || 60 })}
                  min={1}
                  max={480}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pass Percentage</label>
                <input
                  type="number"
                  className="input"
                  value={form.passPercentage}
                  onChange={(e) => setForm({ ...form, passPercentage: parseInt(e.target.value) || 75 })}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingExam(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingExam ? 'Update' : 'Create'} Exam</button>
            </div>
          </form>
        </div>
      )}

      {/* Exams Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" style={{ height: '200px' }}>
              <div className="skeleton-line" style={{ width: '60%', height: '18px' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '14px', marginTop: '12px' }} />
              <div className="skeleton-line" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams yet"
          message="Create your first exam to start adding questions."
          actionLabel="Create Exam"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {exams.map((exam) => (
            <div key={exam._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{exam.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => startEdit(exam)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn icon-btn-danger" onClick={() => setDeleteTarget(exam)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {exam.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {exam.description}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <BookOpen size={14} /> {exam.questionCount || 0} questions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Clock size={14} /> {exam.timeLimit} min
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Target size={14} /> Pass: {exam.passPercentage}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Users size={14} /> {exam.timesTaken || 0} taken
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Exam"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All questions in this exam will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
