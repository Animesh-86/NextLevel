'use client';

import { X, Upload, Loader2 } from 'lucide-react';

export default function FileUploadModal({
  isOpen,
  onClose,
  onSubmit,
  uploading,
  dragover,
  setDragover,
  fileToUpload,
  setFileToUpload,
  uploadTitle,
  setUploadTitle,
  uploadCategory,
  setUploadCategory,
  fileCategoryOptions
}) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={() => !uploading && onClose()}>
      <div className="capture-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="capture-modal-header">
          <h2 className="capture-modal-title">Upload File</h2>
          <button className="icon-btn" onClick={() => !uploading && onClose()}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="capture-form">
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
              {fileCategoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
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
  );
}
