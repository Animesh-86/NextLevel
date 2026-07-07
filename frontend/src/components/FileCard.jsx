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
  'system-design': 'System Design',
  'dsa': 'DSA',
  'web-dev': 'Web Dev',
  'database': 'Database',
  'devops': 'DevOps',
  'math': 'Math',
  'college': 'College',
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

export default function FileCard({ file, onView, onDelete, onPin, onDownload }) {
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = fileTypeIcons[file.fileType] || fileTypeIcons.other;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="file-card" data-pinned={file.isPinned}>
      <div className="file-card-header">
        <div className="file-card-icon" style={{ color: typeConfig.color }}>
          <TypeIcon size={24} />
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
            onClick={() => onPin(file._id, !file.isPinned)}
          >
            {file.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button className="icon-btn" title="Delete" onClick={() => onDelete(file._id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="file-card-title">{file.title || file.fileName}</div>

      {file.summary && (
        <p className="file-card-summary">{file.summary}</p>
      )}

      <div className="file-card-meta-row">
        <span className="file-card-category">
          {categoryLabels[file.category] || 'Other'}
        </span>
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
