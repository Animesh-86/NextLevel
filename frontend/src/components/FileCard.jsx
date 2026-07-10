'use client';
import { useState } from 'react';
import {
  FileText, Image, File, Table, Pin, PinOff,
  Trash2, Download, Eye, MoreVertical, Tag
} from 'lucide-react';

const fileTypeIcons = {
  pdf: { icon: FileText, color: 'var(--text-primary)' },
  image: { icon: Image, color: 'var(--text-secondary)' },
  doc: { icon: FileText, color: 'var(--text-secondary)' },
  spreadsheet: { icon: Table, color: 'var(--text-muted)' },
  other: { icon: File, color: 'var(--text-muted)' },
};

const categoryLabels = {
  'work': 'Work',
  'personal': 'Personal',
  'education': 'Education',
  'finance': 'Finance',
  'health': 'Health',
  'projects': 'Projects',
  'notes': 'Notes',
  'other': 'Other',
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FileCard({ file, onView, onDelete, onPin, onDownload, onPatchCategory, isSelected, onSelect }) {
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = fileTypeIcons[file.fileType] || fileTypeIcons.other;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="file-card" data-pinned={file.isPinned}>
      <div className="file-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={(e) => {
            if (onSelect) onSelect(file.id || file._id, e.target.checked);
          }}
          style={{
            width: '15px',
            height: '15px',
            borderRadius: '4px',
            border: '1px solid var(--border-light)',
            background: 'var(--bg-surface-dark)',
            cursor: 'pointer',
            accentColor: 'var(--brand)',
            marginRight: '2px'
          }}
          title="Select for comparison"
        />
        <div className="file-card-icon" style={{ color: typeConfig.color }}>
          <TypeIcon size={22} />
        </div>
        <div className="file-card-type-badge">
          {file.fileType.toUpperCase()}
        </div>
        <div className="file-card-actions">
          <button className="icon-btn" title="View" onClick={() => onView(file)}>
            <Eye size={14} />
          </button>
          <button className="icon-btn" title="Download" onClick={() => onDownload(file)}>
            <Download size={14} />
          </button>
          <button
            className="icon-btn"
            title={file.isPinned ? 'Unpin' : 'Pin'}
            onClick={() => onPin(file.id || file._id, !file.isPinned)}
          >
            {file.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button className="icon-btn" title="Delete" onClick={() => onDelete(file.id || file._id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="file-card-title">{file.title || file.fileName}</div>

      {file.summary && (
        <p className="file-card-summary">{file.summary}</p>
      )}

      <div className="file-card-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            style={{ 
              appearance: 'none',
              WebkitAppearance: 'none',
              padding: '4px 22px 4px 8px', 
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            value={file.category}
            onChange={async (e) => {
              const newCat = e.target.value;
              if (newCat !== file.category && onPatchCategory) {
                await onPatchCategory(file.id || file._id, newCat);
              }
            }}
          >
            {Object.entries(categoryLabels).map(([val, label]) => (
              <option key={val} value={val} style={{ background: '#121212', color: '#fff' }}>{label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '8px', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', opacity: 0.7 }}>
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <span className="file-card-size">{formatSize(file.fileSize)}</span>
      </div>

      {file.tags?.length > 0 && (
        <div className="file-card-tags">
          {file.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="capture-tag"><Tag size={10} /> {tag}</span>
          ))}
        </div>
      )}

      <div className="file-card-footer">
        <span className="file-card-filename" title={file.fileName}>
          {file.fileName}
        </span>
        <span className="file-card-time">{timeAgo(file.createdAt)}</span>
      </div>
    </div>
  );
}
