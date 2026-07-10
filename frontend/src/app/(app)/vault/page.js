'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  Upload, Search, FolderOpen, Grid, List, Loader2,
  SlidersHorizontal, FileText, Image, File, Table
} from 'lucide-react';
import FileCard from '@/components/FileCard';
import FileViewer from '@/components/FileViewer';
import { SkeletonCard } from '@/components/SkeletonLoader';

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'projects', label: 'Projects' },
  { value: 'notes', label: 'Notes' },
  { value: 'other', label: 'Other' },
];

const typeFilters = [
  { value: 'all', label: 'All Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'doc', label: 'Doc' },
  { value: 'spreadsheet', label: 'Sheet' },
];

export default function FileVault() {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dragover, setDragover] = useState(false);

  // Viewer
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerFiles, setViewerFiles] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Custom Delete
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Multi-select for Side-by-Side Comparison
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  const fileInputRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (fileType !== 'all') params.set('fileType', fileType);
      if (search.trim()) params.set('search', search.trim());

      const res = await apiFetch(`/api/files?${params.toString()}`);
      const data = await res.json();
      if (data.success) setFiles(data.data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, [category, fileType, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchFiles, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchFiles, search]);

  async function handleUpload(selectedFiles) {
    if (!selectedFiles?.length) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`"${file.name}" is too large (max 10MB). Skipping.`);
        continue;
      }

      setUploadProgress(`Uploading ${file.name}... (${uploaded + 1}/${selectedFiles.length})`);

      try {
        const formData = new FormData();
        formData.append('file', file);

        await apiFetch('/api/files', { method: 'POST', body: formData });
        uploaded++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setUploading(false);
    setUploadProgress('');
    fetchFiles();
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const items = e.dataTransfer.files;
    if (items?.length) handleUpload(Array.from(items));
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragover(true);
  }

  async function handleDelete(id) {
    setDeleteTargetId(id);
  }

  async function handlePin(id, pinned) {
    try {
      await apiFetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      });
      fetchFiles();
    } catch (err) {
      console.error('Pin failed:', err);
    }
  }

  async function handlePatchCategory(id, category) {
    try {
      await apiFetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      fetchFiles();
      toast.success('Category updated');
    } catch (err) {
      console.error('Failed to update category:', err);
      toast.error('Failed to update category');
    }
  }

  function handleView(file) {
    setViewerFile(file);
    setViewerOpen(true);
  }

  function handleDownload(file) {
    const fId = file.id || file._id;
    const link = document.createElement('a');
    link.href = `/api/files/${fId}/download`;
    link.download = file.fileName;
    link.click();
  }

  const totalSize = files.reduce((s, f) => s + (f.fileSize || 0), 0);
  const formattedSize = totalSize < 1024 * 1024
    ? (totalSize / 1024).toFixed(0) + ' KB'
    : (totalSize / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">File Vault</h1>
          <p className="capture-hub-subtitle">
            {files.length} file{files.length !== 1 ? 's' : ''} · {formattedSize} stored
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          <Upload size={18} /> Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.md"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(Array.from(e.target.files))}
        />
      </header>

      {/* Dropzone overlay */}
      <div
        className={`vault-dropzone ${dragover ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragover(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        {uploading ? (
          <div className="vault-dropzone-content">
            <Loader2 size={28} className="spin" />
            <p>{uploadProgress}</p>
            <span>AI is analyzing your file...</span>
          </div>
        ) : (
          <div className="vault-dropzone-content">
            <Upload size={28} strokeWidth={1.5} />
            <p>Drop files here or click Upload</p>
            <span>PDFs, images, docs — max 10MB each</span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="capture-toolbar">
        <div className="capture-search-wrapper">
          <Search size={16} className="capture-search-icon" />
          <input
            className="input capture-search-input"
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-secondary capture-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="capture-filters" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="capture-filter-group">
            <label className="capture-filter-label">Subject</label>
            <div className="capture-filter-pills">
              {categoryFilters.map(f => (
                <button
                  key={f.value}
                  className={`capture-filter-pill ${category === f.value ? 'active' : ''}`}
                  onClick={() => setCategory(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="capture-filter-group">
            <label className="capture-filter-label">Type</label>
            <div className="capture-filter-pills">
              {typeFilters.map(f => (
                <button
                  key={f.value}
                  className={`capture-filter-pill ${fileType === f.value ? 'active' : ''}`}
                  onClick={() => setFileType(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Files Grid */}
      {loading ? (
        <div className="capture-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} height="200px" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="capture-empty-state">
          <div className="capture-empty-icon">
            <FolderOpen size={56} strokeWidth={1} />
          </div>
          <h3>No files yet</h3>
          <p>Upload your PDFs, notes, and study materials.<br />Access them from anywhere — phone, laptop, anywhere.</p>
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: '1.5rem' }}
          >
            <Upload size={16} /> Upload your first file
          </button>
        </div>
      ) : (
        <div className="capture-grid">
          {files.map(file => (
            <FileCard
              key={file.id || file._id}
              file={file}
              onView={handleView}
              onDelete={handleDelete}
              onPin={handlePin}
              onDownload={handleDownload}
              onPatchCategory={handlePatchCategory}
              isSelected={selectedFileIds.includes(file.id || file._id)}
              onSelect={(id, checked) => {
                setSelectedFileIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
              }}
            />
          ))}
        </div>
      )}

      {/* File Viewer Modal */}
      <FileViewer
        file={viewerFile}
        files={viewerFiles}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerFile(null);
          setViewerFiles([]);
        }}
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="dialog-overlay" onClick={() => setDeleteTargetId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{
            width: '90%',
            maxWidth: '400px',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Delete File</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this file? This action is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-xs)' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--urgency-critical)', border: 'none', color: '#fff' }}
                onClick={async () => {
                  const id = deleteTargetId;
                  setDeleteTargetId(null);
                  try {
                    await apiFetch(`/api/files/${id}`, { method: 'DELETE' });
                    fetchFiles();
                    toast.success('File deleted successfully');
                  } catch (err) {
                    console.error('Delete failed:', err);
                    toast.error('Failed to delete file');
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Action Bar */}
      {selectedFileIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 20, 0.85)',
          border: '1px solid var(--border-light)',
          backdropFilter: 'blur(20px)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 100,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedFileIds([])}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Clear
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                const selectedFiles = files.filter(f => selectedFileIds.includes(f.id || f._id));
                setViewerFiles(selectedFiles);
                setViewerOpen(true);
              }}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
