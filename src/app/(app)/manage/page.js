'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { Search, Upload, Plus, Trash2, Edit2, FileText, File, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [importModule, setImportModule] = useState('General');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchQuestions();
  }, [selectedExam, selectedModule, searchQuery]);

  async function fetchExams() {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
        if (data.data.length > 0 && !selectedExam) {
          setSelectedExam(data.data[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch exams');
    }
    setLoading(false);
  }

  async function fetchQuestions() {
    try {
      const params = new URLSearchParams({ examId: selectedExam });
      if (selectedModule !== 'all') params.set('module', selectedModule);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      if (data.success) setQuestions(data.data);
    } catch (err) {
      toast.error('Failed to fetch questions');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/questions/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Question deleted');
        fetchQuestions();
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
    setDeleteTarget(null);
  }

  async function handleImportParse() {
    if (!selectedExam) { toast.error('Select an exam first'); return; }
    setImporting(true);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append('examId', selectedExam);
      formData.append('module', importModule);

      if (pasteText.trim()) {
        formData.append('text', pasteText);
      } else if (fileRef.current?.files[0]) {
        formData.append('file', fileRef.current.files[0]);
      } else {
        toast.error('Paste text or upload a file');
        setImporting(false);
        return;
      }

      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setImportPreview(data.data.questions);
        setImportErrors(data.data.errors || []);
        if (data.data.questions.length > 0) {
          toast.info(`Parsed ${data.data.questions.length} questions`);
        } else {
          toast.warning('No questions could be parsed');
        }
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    }
    setImporting(false);
  }

  async function handleImportConfirm() {
    if (!importPreview?.length) return;
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPreview),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${importPreview.length} questions added!`);
        setImportPreview(null);
        setPasteText('');
        setShowImport(false);
        fetchQuestions();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to save questions');
    }
  }

  // Collect unique modules from questions
  const modules = [...new Set(questions.map(q => q.module))];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage and import questions for your exams.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowImport(!showImport)}>
            <Upload size={16} style={{ marginRight: '0.5rem' }} /> Import
          </button>
        </div>
      </header>

      {/* Import Panel */}
      {showImport && (
        <div className="card" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Import Questions</h3>
            <button onClick={() => { setShowImport(false); setImportPreview(null); }} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="form-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Module Name</label>
              <input className="input" value={importModule} onChange={(e) => setImportModule(e.target.value)} placeholder="e.g. Platform Security" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload File (PDF, DOCX, CSV)</label>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.csv" className="input" style={{ padding: '0.4rem' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Or Paste Text</label>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              Format: numbered questions with lettered options, then <code>---ANSWERS---</code> separator.
            </div>
            <textarea
              className="textarea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"1. What is cloud computing?\nA) Local servers\nB) Internet-based computing\nC) Desktop software\nD) Mainframe only\n\n---ANSWERS---\n1. B"}
              rows={6}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleImportParse} className="btn btn-primary" disabled={importing}>
              {importing ? 'Parsing...' : 'Parse & Preview'}
            </button>
            {importPreview && importPreview.length > 0 && (
              <button onClick={handleImportConfirm} className="btn btn-primary" style={{ backgroundColor: 'var(--text-primary)' }}>
                <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
                Confirm & Save {importPreview.length} Questions
              </button>
            )}
          </div>

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={16} /> Parsing Warnings
              </div>
              {importErrors.map((err, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.25rem 0' }}>• {err}</div>
              ))}
            </div>
          )}

          {/* Import Preview */}
          {importPreview && importPreview.length > 0 && (
            <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Preview ({importPreview.length} questions):</div>
              {importPreview.map((q, i) => (
                <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{i + 1}. {q.scenario}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{q.options.length} options • {q.type} • Answer: {q.answer.map(a => String.fromCharCode(65 + a)).join(', ') || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Exam</label>
            <select className="select" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
              {exams.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.title}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Module</label>
            <select className="select" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
              <option value="all">All Modules</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {questions.length} questions
          </div>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 && !loading ? (
        <EmptyState
          icon={FileText}
          title="No questions found"
          message={selectedExam ? "Import or add questions to this exam." : "Select an exam to view its questions."}
          actionLabel="Import Questions"
          onAction={() => setShowImport(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map((q) => (
            <div key={q._id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge">{q.module}</span>
                    <span className="badge">{q.type}</span>
                    {q.timesTested > 0 && (
                      <span className="badge" style={{ fontSize: '0.7rem' }}>
                        {Math.round(((q.timesTested - q.timesFailed) / q.timesTested) * 100)}% success
                      </span>
                    )}
                  </div>
                  <p style={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.5 }}>{q.scenario}</p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {q.options.map((opt, i) => (
                      <span key={i} style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: q.answer.includes(i) ? 'var(--bg-accent)' : 'transparent',
                        fontWeight: q.answer.includes(i) ? 600 : 400,
                      }}>
                        {String.fromCharCode(65 + i)}) {opt}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button className="icon-btn icon-btn-danger" onClick={() => setDeleteTarget(q)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
