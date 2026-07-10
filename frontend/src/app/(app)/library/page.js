'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Link2, Search, Upload, Plus, ExternalLink, FolderOpen, X, Loader2, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useCurrentContext } from '@/lib/CurrentContext';
import FileViewer from '@/components/FileViewer';

function itemId(item) {
  return item._id || item.id;
}

export default function LibraryPage() {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { setActiveContext } = useCurrentContext();

  useEffect(() => {
    setActiveContext("The user is viewing their Library (Files & Links)");
    return () => setActiveContext("");
  }, [setActiveContext]);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  
  // File Viewer states
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

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
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'health', label: 'Health' },
    { value: 'projects', label: 'Projects' },
    { value: 'notes', label: 'Notes' },
    { value: 'other', label: 'Other' },
  ];

  const linkCategoryOptions = [
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'article', label: 'Article' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'tool', label: 'Tool' },
    { value: 'job-posting', label: 'Job Posting' },
    { value: 'video', label: 'Video' },
    { value: 'course', label: 'Course' },
    { value: 'github', label: 'GitHub' },
    { value: 'other', label: 'Other' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Glass Header Banner */}
      <header className="glass-panel" style={{ padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 'var(--space-xs)' }}>
              Library
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
              Files and saved links in one searchable place.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, marginRight: '0.5rem' }}>
              {files.length} file{files.length !== 1 ? 's' : ''} • {links.length} link{links.length !== 1 ? 's' : ''}
            </span>
            <button className="btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} onClick={() => setUploadModalOpen(true)}>
              <Upload size={16} style={{ marginRight: '8px' }} /> Upload File
            </button>
            <button className="btn btn-primary" onClick={() => setLinkModalOpen(true)}>
              <Plus size={16} style={{ marginRight: '8px' }} /> Add Link
            </button>
          </div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', 
        gap: 'var(--space-md)' 
      }}>
        {/* Files Bento */}
        <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Files
            </h2>
            <Link href="/vault" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Manage files</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredFiles.slice(0, 8).map((file) => (
              <div key={itemId(file)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)', color: 'inherit'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <span className="dash-capture-title" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.title || file.fileName || 'Untitled file'}
                  </span>
                  <span className="dash-capture-cat">{file.fileType || file.category || 'file'}</span>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    setViewerFile(file);
                    setViewerOpen(true);
                  }}
                >
                  <Eye size={12} /> Open
                </button>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="dash-empty-mini">
                <FileText size={24} />
                <p>No files match your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* Links Bento */}
        <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={18} /> Links
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredLinks.slice(0, 8).map((link) => (
              <a key={itemId(link)} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit'
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link.title || link.url || 'Untitled link'}
                </span>
                <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}
            {filteredLinks.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-lg) 0', color: 'var(--text-muted)' }}>
                <Link2 size={24} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem' }}>No links match your search.</p>
              </div>
            )}
          </div>
        </section>
      </div>
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

            <form onSubmit={handleFileUploadSubmit} className="capture-form">
              <div 
                className={`capture-dropzone ${dragover ? 'dragover' : ''}`}
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
                <div className="capture-dropzone-content">
                  <Upload size={28} />
                  {fileToUpload ? (
                    <div>
                      <p style={{ color: 'var(--text-primary)' }}>{fileToUpload.name}</p>
                      <span style={{ fontSize: '0.8rem' }}>
                        {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p>Drag and drop or click to choose a file</p>
                      <span style={{ fontSize: '0.8rem' }}>Max file size 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="capture-field">
                <label className="auth-label">Custom Title (Optional)</label>
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
                <label className="auth-label">Category</label>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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

            <form onSubmit={handleLinkSubmit} className="capture-form">
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
                  {linkCategoryOptions.map(opt => (
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
      
      {/* File Viewer Workspace Overlay */}
      <FileViewer
        file={viewerFile}
        isOpen={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerFile(null); }}
      />
    </div>
  );
}
