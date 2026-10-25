'use client';

import { X, Loader2 } from 'lucide-react';

export default function AddLinkModal({
  isOpen,
  onClose,
  onSubmit,
  linkForm,
  setLinkForm,
  savingLink,
  linkCategoryOptions
}) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={() => !savingLink && onClose()}>
      <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="capture-modal-header">
          <h2 className="capture-modal-title">Add Link</h2>
          <button className="icon-btn" onClick={() => !savingLink && onClose()}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="capture-form">
          <div className="capture-field">
            <label className="auth-label">URL *</label>
            <input 
              type="url"
              className="input"
              placeholder="https://example.com"
              required
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              disabled={savingLink}
            />
          </div>

          <div className="capture-field">
            <label className="auth-label">Title *</label>
            <input 
              type="text"
              className="input"
              placeholder="Link Title"
              required
              value={linkForm.title}
              onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
              disabled={savingLink}
            />
          </div>

          <div className="capture-field">
            <label className="auth-label">Description (Optional)</label>
            <textarea 
              className="textarea"
              placeholder="Add details about this link..."
              rows={3}
              value={linkForm.description}
              onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
              disabled={savingLink}
            />
          </div>

          <div className="capture-field">
            <label className="auth-label">Category</label>
            <select
              className="select"
              value={linkForm.category}
              onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
              disabled={savingLink}
            >
              {linkCategoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="capture-field">
            <label className="auth-label">Tags (comma-separated)</label>
            <input 
              type="text"
              className="input"
              placeholder="tag1, tag2, tag3"
              value={linkForm.tags}
              onChange={(e) => setLinkForm({ ...linkForm, tags: e.target.value })}
              disabled={savingLink}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={savingLink}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={savingLink || !linkForm.url || !linkForm.title}
            >
              {savingLink ? (
                <>
                  <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} />
                  Saving...
                </>
              ) : 'Save Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
