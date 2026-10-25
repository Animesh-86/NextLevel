'use client';

import { FileText, Copy } from 'lucide-react';

export default function RoomNotesStage({
  activeTab,
  scratchpadView,
  setScratchpadView,
  sharedNotes,
  setSharedNotes,
  toast
}) {
  if (activeTab !== 'notes') return null;

  return (
    <div className="card glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Room Scratchpad</h3>
          <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
            Shared Markdown
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setScratchpadView(prev => (prev === 'edit' ? 'preview' : 'edit'))}
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
          >
            {scratchpadView === 'edit' ? 'Show Preview' : 'Edit Markdown'}
          </button>
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(sharedNotes);
              }
              if (toast) toast.success('Notes copied to clipboard!');
            }}
            className="btn btn-secondary"
            style={{ padding: '3px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Copy size={12} /> Copy
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '340px', display: 'flex' }}>
        {scratchpadView === 'edit' ? (
          <textarea
            value={sharedNotes}
            onChange={(e) => setSharedNotes(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.88rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.6
            }}
            placeholder="Write collaborative notes, pseudo-code, LeetCode patterns, or meeting minutes..."
          />
        ) : (
          <div style={{ width: '100%', height: '100%', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {sharedNotes}
          </div>
        )}
      </div>
    </div>
  );
}
