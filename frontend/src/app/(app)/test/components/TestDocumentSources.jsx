'use client';
import {
  BrainCircuit,
  Check,
  X,
  Upload,
  Trash2,
  ClipboardPaste,
  Info,
  Search,
} from 'lucide-react';

export default function TestDocumentSources({
  selectedExams,
  setSelectedExams,
  exams,
  sourceSearch,
  setSourceSearch,
  historySearch,
  setHistorySearch,
  setShowPasteModal,
  setShowFormatGuide,
  handleUploadQuestions,
  handleDeleteExam,
}) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
      gap: 'var(--space-md)' 
    }}>
      {/* Document Source */}
      <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Document Source</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowPasteModal(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <ClipboardPaste size={14} style={{ marginRight: '0.4rem' }} /> Paste
            </button>
            <label className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
              <Upload size={14} style={{ marginRight: '0.4rem' }} /> Upload
              <input type="file" accept=".json,.pdf,.docx,.txt,.csv" onChange={handleUploadQuestions} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Upload a file or paste questions.
          </p>
          <span style={{ color: 'var(--border-strong)', fontSize: '0.75rem' }}>•</span>
          <button
            onClick={() => setShowFormatGuide(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--brand-primary, #818cf8)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0', fontWeight: 500 }}
            title="View accepted formats"
          >
            <Info size={13} />
            <span>Accepted Formats</span>
          </button>
        </div>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 'var(--space-sm)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
            placeholder="Search documents..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
          {sourceSearch && (
            <button onClick={() => setSourceSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
        {/* Inline list */}
        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {'Global Pool (All Questions)'.toLowerCase().includes(sourceSearch.toLowerCase()) && (
            <button
              onClick={() => setSelectedExams(['all'])}
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: selectedExams.includes('all') ? 'var(--brand-primary-alpha, rgba(99,102,241,0.15))' : 'transparent', border: selectedExams.includes('all') ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
            >
              <span style={{ fontWeight: selectedExams.includes('all') ? 600 : 400 }}>Global Pool (All Questions)</span>
              {selectedExams.includes('all') && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
            </button>
          )}
          {exams
            .filter(ex => ex.title.toLowerCase().includes(sourceSearch.toLowerCase()))
            .map(ex => {
              const id = ex.id || ex._id;
              const isSelected = selectedExams.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (selectedExams.includes('all')) {
                      setSelectedExams([id]);
                    } else {
                      setSelectedExams(prev => {
                        if (prev.includes(id)) {
                          const next = prev.filter(x => x !== id);
                          return next.length ? next : ['all'];
                        }
                        return [...prev, id];
                      });
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: isSelected ? 'var(--brand-primary-alpha, rgba(99,102,241,0.15))' : 'transparent', border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{ex.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{ex.questionCount ?? ''} Q</span>
                  </div>
                  {isSelected && <Check size={14} style={{ flexShrink: 0, color: 'var(--brand-primary)' }} />}
                </button>
              );
            })}
          {exams.filter(ex => ex.title.toLowerCase().includes(sourceSearch.toLowerCase())).length === 0 && !'Global Pool (All Questions)'.toLowerCase().includes(sourceSearch.toLowerCase()) && (
            <p style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matching documents</p>
          )}
        </div>
      </section>

      {/* Document History */}
      <section className="glass-panel" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document History</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', padding: '4px 8px' }}>
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              style={{ width: '120px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {exams.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No documents uploaded yet.</p>
          ) : exams.filter(ex => ex.title.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No matching history.</p>
          ) : (
            exams.filter(ex => ex.title.toLowerCase().includes(historySearch.toLowerCase())).map(ex => (
              <div key={ex._id || ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.createdAt ? new Date(ex.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <button onClick={() => handleDeleteExam(ex._id || ex.id)} className="icon-btn" title="Delete document" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
