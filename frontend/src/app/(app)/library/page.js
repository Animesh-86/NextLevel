'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Link2, Search, Upload, Plus, ExternalLink, FolderOpen, X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';

function itemId(item) {
  return item._id || item.id;
}

export default function LibraryPage() {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // File Upload states
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragover, setDragover] = useState(false);

  // Link form states
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '', category: 'other', tags: '' });
  const [savingLink, setSavingLink] = useState(false);

  const fileCategoryOptions = [
    { value: 'system-design', label: '🏗️ System Design' },
    { value: 'dsa', label: '🧮 DSA' },
    { value: 'web-dev', label: '🌐 Web Dev' },
    { value: 'database', label: '🗄️ Database' },
    { value: 'devops', label: '⚙️ DevOps' },
    { value: 'math', label: '📐 Math' },
    { value: 'college', label: '🎓 College' },
    { value: 'notes', label: '📝 Notes' },
    { value: 'other', label: '📌 Other' },
  ];

  const linkCategoryOptions = [
    { value: 'tutorial', label: '📖 Tutorial' },
    { value: 'article', label: '📄 Article' },
    { value: 'documentation', label: '📚 Docs' },
    { value: 'tool', label: '🛠️ Tool' },
    { value: 'job-posting', label: '💼 Job Post' },
    { value: 'video', label: '🎥 Video' },
    { value: 'course', label: '🎓 Course' },
    { value: 'github', label: '💻 GitHub' },
    { value: 'other', label: '🔗 Other' },
  ];

  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setUploadProgress(`Uploading ${fileToUpload.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }
      formData.append('category', uploadCategory);

      const res = await apiFetch('/api/files', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadModalOpen(false);
        setFileToUpload(null);
        setUploadTitle('');
        setUploadCategory('other');
        const filesRes = await apiFetch('/api/files');
        const filesData = await filesRes.json();
        setFiles(filesData.success ? filesData.data || [] : []);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkForm.url || !linkForm.title) return;
    setSavingLink(true);
    try {
      const payload = {
        ...linkForm,
        tags: linkForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const res = await apiFetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setLinkModalOpen(false);
        setLinkForm({ url: '', title: '', description: '', category: 'other', tags: '' });
        const linksRes = await apiFetch('/api/links');
        const linksData = await linksRes.json();
        setLinks(linksData.success ? linksData.data || [] : []);
      } else {
        alert(data.error || 'Failed to save link');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save link');
    } finally {
      setSavingLink(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      setLoading(true);
      try {
        const [filesRes, linksRes] = await Promise.all([
          apiFetch('/api/files'),
          apiFetch('/api/links'),
        ]);
        const [filesData, linksData] = await Promise.all([
          filesRes.json(),
          linksRes.json(),
        ]);

        if (!active) return;
        setFiles(filesData.success ? filesData.data || [] : []);
        setLinks(linksData.success ? linksData.data || [] : []);
      } catch (err) {
        if (active) {
          setFiles([]);
          setLinks([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLibrary();
    return () => {
      active = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) =>
      [file.title, file.fileName, file.summary, file.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [files, search]);

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((link) =>
      [link.title, link.url, link.description, link.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [links, search]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Library</h1>
          <p className="capture-hub-subtitle">
            Files and saved links in one searchable place.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setUploadModalOpen(true)}>
            <Upload size={16} /> Upload File
          </button>
          <button className="btn btn-primary" onClick={() => setLinkModalOpen(true)}>
            <Plus size={16} /> Add Link
          </button>
        </div>
      </header>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <FileText size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{files.length}</span>
          <span className="dash-stat-label">Files</span>
        </div>
        <div className="dash-stat-card">
          <Link2 size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{links.length}</span>
          <span className="dash-stat-label">Links</span>
        </div>
        <div className="dash-stat-card">
          <FolderOpen size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{files.length + links.length}</span>
          <span className="dash-stat-label">Library Items</span>
        </div>
      </div>

      <div className="capture-toolbar">
        <div className="capture-search-wrapper">
          <Search size={16} className="capture-search-icon" />
          <input
            className="input capture-search-input"
            type="text"
            placeholder="Search files and links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="dash-main-grid">
          <SkeletonCard height="260px" />
          <SkeletonCard height="260px" />
        </div>
      ) : (
        <div className="dash-main-grid">
          <section className="card">
            <div className="card-title-row">
              <h2 className="card-title">Files</h2>
              <Link className="dash-see-all" href="/vault">Manage files</Link>
            </div>
            <div className="dash-capture-list">
              {filteredFiles.slice(0, 8).map((file) => (
                <Link key={itemId(file)} className="dash-capture-item" href="/vault">
                  <span className="dash-capture-title">{file.title || file.fileName || 'Untitled file'}</span>
                  <span className="dash-capture-cat">{file.fileType || file.category || 'file'}</span>
                </Link>
              ))}
              {filteredFiles.length === 0 && (
                <div className="dash-empty-mini">
                  <FileText size={24} />
                  <p>No files match your search.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-title-row">
              <h2 className="card-title">Links</h2>
              <Link className="dash-see-all" href="/links">Manage links</Link>
            </div>
            <div className="dash-capture-list">
              {filteredLinks.slice(0, 8).map((link) => (
                <a
                  key={itemId(link)}
                  className="dash-capture-item"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="dash-capture-title">{link.title || link.url || 'Untitled link'}</span>
                  <span className="dash-capture-cat"><ExternalLink size={12} /></span>
                </a>
              ))}
              {filteredLinks.length === 0 && (
                <div className="dash-empty-mini">
                  <Link2 size={24} />
                  <p>No links match your search.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Upload File Modal */}
      {uploadModalOpen && (
        <div className="dialog-overlay" onClick={() => !uploading && setUploadModalOpen(false)}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="capture-modal-header">
              <h2 className="capture-modal-title">Upload File</h2>
              <button className="icon-btn" onClick={() => !uploading && setUploadModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFileUploadSubmit}>
              <div 
                className={`vault-dropzone ${dragover ? 'dragover' : ''}`}
                style={{ 
                  border: '2px dashed var(--border-strong)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '2rem 1rem', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: dragover ? 'var(--bg-accent)' : 'transparent',
                  marginBottom: '1rem'
                }}
                onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragover(false);
                  if (e.dataTransfer.files?.length) {
                    setFileToUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('modal-file-input').click()}
              >
                <input 
                  id="modal-file-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                />
                <Upload size={32} style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }} />
                {fileToUpload ? (
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fileToUpload.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 500 }}>Drag and drop or click to choose a file</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max file size 10MB</p>
                  </div>
                )}
              </div>

              <div className="capture-field">
                <label className="capture-label">Custom Title (Optional)</label>
                <input 
                  type="text"
                  className="input"
                  placeholder={fileToUpload ? fileToUpload.name.split('.').slice(0, -1).join('.') : "Enter custom title"}
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="capture-field">
                <label className="capture-label">Category</label>
                <select
                  className="select"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={uploading}
                >
                  {fileCategoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="capture-actions" style={{ marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading || !fileToUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} />
                      Uploading...
                    </>
                  ) : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {linkModalOpen && (
        <div className="dialog-overlay" onClick={() => !savingLink && setLinkModalOpen(false)}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="capture-modal-header">
              <h2 className="capture-modal-title">Add Link</h2>
              <button className="icon-btn" onClick={() => !savingLink && setLinkModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit}>
              <div className="capture-field">
                <label className="capture-label">URL *</label>
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
                <label className="capture-label">Title *</label>
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
                <label className="capture-label">Description (Optional)</label>
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
                <label className="capture-label">Category</label>
                <select
                  className="select"
                  value={linkForm.category}
                  onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
                  disabled={savingLink}
                >
                  {linkCategoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="capture-field">
                <label className="capture-label">Tags (comma-separated)</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="tag1, tag2, tag3"
                  value={linkForm.tags}
                  onChange={(e) => setLinkForm({ ...linkForm, tags: e.target.value })}
                  disabled={savingLink}
                />
              </div>

              <div className="capture-actions" style={{ marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setLinkModalOpen(false)}
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
      )}
    </div>
  );
}
