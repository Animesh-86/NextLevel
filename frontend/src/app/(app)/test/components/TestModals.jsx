'use client';

import {
  X, Info, FileText, Download, ClipboardPaste, Loader2,
  AlertTriangle, ListFilter
} from 'lucide-react';
import TestQuestionNavigator from './TestQuestionNavigator';

export function FormatGuideModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel" style={{ width: '90%', maxWidth: '560px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Accepted Formats</h2>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              <FileText size={14} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI-Powered (Recommended)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Just paste or upload questions in <strong>any format</strong> — numbered, bulleted, with or without answer keys. AI will detect and parse them automatically.
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              <Download size={14} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Manual Format (Fallback)</span>
            </div>
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>{`1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid

2. Which planet is closest to the Sun?
A) Earth
B) Venus
C) Mercury
D) Mars

---ANSWERS---
1 B
2 C`}</pre>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>JSON Format</span>
            </div>
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>{`[{
  "scenario": "What is 2+2?",
  "options": ["3", "4", "5", "6"],
  "answer": [1],
  "type": "MCQ"
}]`}</pre>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Supported file types: PDF, DOCX, TXT, JSON
        </p>
      </div>
    </div>
  );
}

export function PasteQuestionsModal({
  open,
  onClose,
  pasteTitle,
  setPasteTitle,
  pasteText,
  setPasteText,
  pasteProcessing,
  handlePasteSubmit
}) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel" style={{ width: '90%', maxWidth: '640px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Paste Questions</h2>
          <button onClick={onClose} className="icon-btn" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
          Give your test a name, then paste your questions below.
        </p>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Test Name</label>
        <input
          type="text"
          value={pasteTitle}
          onChange={(e) => setPasteTitle(e.target.value)}
          placeholder="e.g. Java Collections, OOP Concepts, Spring Boot..."
          style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', marginBottom: 'var(--space-sm)' }}
        />
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`Example:\n\n1. What is the capital of France?\n   a) London\n   b) Paris (correct)\n   c) Berlin\n   d) Madrid\n\n2. Which is the largest planet?\n   a) Earth\n   b) Jupiter (correct)\n   c) Mars\n   d) Venus`}
          style={{ width: '100%', minHeight: '250px', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {pasteText.trim().length > 0 ? `${pasteText.trim().split('\n').length} lines` : 'No content'}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              onClick={handlePasteSubmit}
              className="btn btn-primary"
              disabled={!pasteText.trim() || pasteProcessing}
              style={{ minWidth: '140px' }}
            >
              {pasteProcessing ? <Loader2 size={16} className="auth-spinner" /> : <><ClipboardPaste size={14} style={{ marginRight: '0.4rem' }} /> Parse Questions</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UploadNameModal({
  pendingUpload,
  onClose,
  uploadName,
  setUploadName,
  confirmUpload
}) {
  if (!pendingUpload) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Name Your Test</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
          Give this uploaded test a name so you can find it easily later.
        </p>
        <input
          type="text"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
          placeholder="e.g. Java Collections, OOP Concepts..."
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && uploadName.trim()) confirmUpload(); }}
          style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-md)' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={confirmUpload} className="btn btn-primary" disabled={!uploadName.trim()}>Upload</button>
        </div>
      </div>
    </div>
  );
}

export function ReviewSubmitModal({
  answeredCount,
  unansweredCount,
  flaggedCount,
  submitting,
  onBack,
  onSubmit
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(5, 5, 8, 0.95)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Submit Exam?</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{answeredCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Answered</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{unansweredCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unanswered</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{flaggedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flagged</div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--warning)' }}>
            <AlertTriangle size={16} /> You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ flex: 1 }} disabled={submitting}>Go Back</button>
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              if (!submitting) onSubmit();
            }}
            style={{ flex: 1 }}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={18} className="auth-spinner" /> : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileQuestionNavigatorDrawer({
  open,
  onClose,
  answeredCount,
  questions,
  currentIdx,
  setCurrentIdx,
  answers,
  flagged,
  lockedQuestions,
  isOaBlitz,
  isStudy = false,
  checked = new Set(),
  checkedResults = {},
  toast
}) {
  if (!open) return null;
  return (
    <>
      <div className="mobile-navigator-backdrop" onClick={onClose} />
      <div className="mobile-navigator-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListFilter size={18} /> Question Palette
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>
        <TestQuestionNavigator
          questions={questions}
          currentIdx={currentIdx}
          setCurrentIdx={(idx) => {
            setCurrentIdx(idx);
            onClose();
          }}
          answers={answers}
          flagged={flagged}
          lockedQuestions={lockedQuestions}
          isOaBlitz={isOaBlitz}
          isStudy={isStudy}
          checked={checked}
          checkedResults={checkedResults}
          toast={toast}
          answeredCount={answeredCount}
        />
      </div>
    </>
  );
}
