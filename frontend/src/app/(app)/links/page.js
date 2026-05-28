'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Link2, Plus, Search, ExternalLink, Pin, Trash2, Loader2,
  BookOpen, Video, Wrench, Code2, FileText, Globe, GraduationCap, X, Edit2
} from 'lucide-react';

const categoryIcons = {
  tutorial: BookOpen, article: FileText, documentation: FileText,
  tool: Wrench, 'job-posting': Globe, video: Video, course: GraduationCap, github: Code2, other: Link2,
};
const categoryLabels = {
  tutorial: 'Tutorial', article: 'Article', documentation: 'Docs',
  tool: 'Tool', 'job-posting': 'Job Post', video: 'Video',
  course: 'Course', github: 'GitHub', other: 'Other',
};

export default function LinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', title: '', description: '', category: 'other', tags: '' });

  const [editingId, setEditingId] = useState(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('category', filter);
    if (search) params.set('search', search);
    try {
      const r = await fetch(`/api/links?${params}`).then(r => r.json());
      if (r.success) setLinks(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function saveLink() {
    if (!form.url || !form.title) return;
    const url = editingId ? `/api/links/${editingId}` : '/api/links';
    const method = editingId ? 'PATCH' : 'POST';
    
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    });
    setForm({ url: '', title: '', description: '', category: 'other', tags: '' });
    setShowForm(false);
    setEditingId(null);
    fetchLinks();
  }

  function startEdit(link) {
    setForm({
      url: link.url,
      title: link.title,
      description: link.description || '',
      category: link.category || 'other',
      tags: (link.tags || []).join(', ')
    });
    setEditingId(link._id);
    setShowForm(true);
  }

  async function togglePin(id, pinned) {
    await fetch(`/api/links/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !pinned }),
    });
    fetchLinks();
  }

  async function deleteLink(id) {
    await fetch(`/api/links/${id}`, { method: 'DELETE' });
    fetchLinks();
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Saved Links</h1>
          <p className="capture-hub-subtitle">Your bookmarked resources — {links.length} links</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ url: '', title: '', description: '', category: 'other', tags: '' });
          setEditingId(null);
          setShowForm(!showForm);
        }}>
          <Plus size={16} /> Add Link
        </button>
      </header>

      {showForm && (
        <div className="dialog-overlay" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="capture-modal-header">
              <h2 className="capture-modal-title">
                {editingId ? 'Edit Link' : 'Add New Link'}
              </h2>
              <button className="icon-btn" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className="capture-form" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="capture-filter-label" style={{ marginBottom: '0.35rem', display: 'block' }}>URL *</label>
                <input
                  className="input"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="capture-filter-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Title *</label>
                <input
                  className="input"
                  placeholder="Link name..."
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="capture-filter-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="capture-filter-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Tags (comma separated)</label>
                  <input
                    className="input"
                    placeholder="react, tutorial, beginner"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="capture-filter-label" style={{ marginBottom: '0.35rem', display: 'block' }}>Description</label>
                <textarea
                  className="input"
                  placeholder="Optional notes..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={saveLink}>
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="capture-search-bar" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} />
          <input className="input" style={{ flex: 1 }} placeholder="Search links..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', ...Object.keys(categoryLabels)].map(c => (
          <button key={c} className={`capture-filter-pill ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c === 'all' ? 'All' : categoryLabels[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><Loader2 size={32} className="spin" /></div>
      ) : links.length === 0 ? (
        <div className="capture-empty-state">
          <Link2 size={56} strokeWidth={1} /><h3>No links saved</h3>
          <p>Save useful tutorials, articles, and resources</p>
        </div>
      ) : (
        <div className="links-grid">
          {links.map(link => {
            const Icon = categoryIcons[link.category] || Link2;
            return (
              <div
                key={link._id}
                className={`link-card ${link.isPinned ? 'pinned' : ''}`}
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('a')) return;
                  startEdit(link);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="link-card-header">
                  <img src={link.favicon || `https://www.google.com/s2/favicons?domain=example.com&sz=32`} alt="" width={20} height={20} style={{ borderRadius: '4px' }} />
                  <span className="link-card-category">{categoryLabels[link.category]}</span>
                  <div className="link-card-actions">
                    <button className="icon-btn" onClick={() => startEdit(link)} title="Edit Link">
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => togglePin(link._id, link.isPinned)} title={link.isPinned ? 'Unpin' : 'Pin'}>
                      <Pin size={14} style={{ fill: link.isPinned ? 'currentColor' : 'none' }} />
                    </button>
                    <button className="icon-btn" onClick={() => deleteLink(link._id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <a href={link.url} target="_blank" rel="noopener" className="link-card-title">
                  {link.title} <ExternalLink size={12} />
                </a>
                {link.description && <p className="link-card-desc">{link.description}</p>}
                {link.tags?.length > 0 && (
                  <div className="link-card-tags">
                    {link.tags.map((t, i) => <span key={i} className="badge">{t}</span>)}
                  </div>
                )}
                <div className="link-card-url">{new URL(link.url).hostname}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
