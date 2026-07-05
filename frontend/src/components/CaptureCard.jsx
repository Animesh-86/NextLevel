'use client';
import { useState } from 'react';
import {
  Pin, PinOff, Clock, Trash2, Edit3, Archive, CheckCircle,
  ExternalLink, Image as ImageIcon, AlertTriangle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

const urgencyConfig = {
  critical: { color: '#ef4444', label: 'CRITICAL', bg: 'rgba(239,68,68,0.12)' },
  high: { color: '#f97316', label: 'HIGH', bg: 'rgba(249,115,22,0.12)' },
  medium: { color: '#eab308', label: 'MEDIUM', bg: 'rgba(234,179,8,0.12)' },
  low: { color: '#3b82f6', label: 'LOW', bg: 'rgba(59,130,246,0.12)' },
  none: { color: 'var(--text-muted)', label: 'NONE', bg: 'transparent' },
};

function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function reminderText(date) {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  const diff = d - now;

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / 3600000);
    const days = Math.floor(overdue / 86400000);
    if (days > 0) return `Overdue by ${days}d`;
    if (hours > 0) return `Overdue by ${hours}h`;
    return 'Overdue';
  }

  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `Due in ${days}d`;
  if (hours > 0) return `Due in ${hours}h`;
  const mins = Math.floor(diff / 60000);
  return `Due in ${mins}m`;
}

export default function CaptureCard({ capture, onEdit, onDelete, onPin, onArchive, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const urg = urgencyConfig[capture.urgency] || urgencyConfig.none;
  const isOverdue = capture.reminderAt && new Date(capture.reminderAt) < new Date();
  const hasLongContent = (capture.rawContent?.length || 0) > 150 ||
                          (capture.description?.length || 0) > 100;

  return (
    <div
      className="capture-card"
      style={{ '--urgency-color': urg.color, cursor: 'pointer' }}
      data-urgency={capture.urgency}
      data-pinned={capture.isPinned}
      onClick={(e) => {
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.capture-tag') || e.target.closest('.capture-preview-remove')) return;
        onEdit?.(capture);
      }}
    >
      {/* Header */}
      <div className="capture-card-header">
        <div className="capture-card-meta">
          <span className="capture-card-category">
            {capture.category}
          </span>
          <span className="capture-card-time">{timeAgo(capture.createdAt)}</span>
        </div>
        <div className="capture-card-actions">
          <button
            className={`icon-btn ${capture.isPinned ? 'icon-btn-active' : ''}`}
            onClick={() => onPin?.(capture._id, !capture.isPinned)}
            title={capture.isPinned ? 'Unpin' : 'Pin'}
          >
            {capture.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button className="icon-btn" onClick={() => onEdit?.(capture)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button className="icon-btn icon-btn-danger" onClick={() => onDelete?.(capture._id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title & Urgency */}
      <div className="capture-card-title-row">
        <h3 className="capture-card-title">
          {capture.title.includes('Processing') && <Loader2 size={16} className="auth-spinner" style={{ display: 'inline', marginRight: '6px', color: 'var(--text-muted)' }} />}
          {capture.description?.includes('failed') && <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', color: '#ef4444' }} />}
          {capture.title}
        </h3>
        {capture.urgency !== 'none' && (
          <span
            className="capture-urgency-badge"
            style={{ color: urg.color, background: urg.bg, borderColor: urg.color }}
          >
            {urg.label}
          </span>
        )}
      </div>

      {/* Content preview */}
      {(capture.description || capture.rawContent) && (
        <div className={`capture-card-content ${expanded ? 'expanded' : ''}`}>
          <p>{capture.description || capture.rawContent}</p>
          {hasLongContent && (
            <button className="capture-expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
            </button>
          )}
        </div>
      )}

      {/* Screenshot indicator */}
      {capture.type === 'screenshot' && (
        <div className="capture-screenshot-badge">
          <ImageIcon size={14} /> Screenshot attached
        </div>
      )}

      {/* URL preview */}
      {capture.type === 'link' && capture.rawContent && (
        <a
          href={capture.rawContent}
          target="_blank"
          rel="noopener noreferrer"
          className="capture-link-preview"
        >
          <ExternalLink size={14} />
          <span>{capture.rawContent.length > 60 ? capture.rawContent.slice(0, 57) + '...' : capture.rawContent}</span>
        </a>
      )}

      {/* Tags */}
      {capture.tags?.length > 0 && (
        <div className="capture-card-tags">
          {capture.tags.map((tag) => (
            <span key={tag} className="capture-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Footer — Reminder */}
      <div className="capture-card-footer">
        {capture.reminderAt && (
          <span className={`capture-reminder ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
            {reminderText(capture.reminderAt)}
          </span>
        )}
        <div className="capture-card-footer-actions">
          {capture.status === 'active' && (
            <>
              <button
                className="capture-action-btn"
                onClick={() => onComplete?.(capture._id)}
                title="Mark complete"
              >
                <CheckCircle size={14} /> Done
              </button>
              <button
                className="capture-action-btn"
                onClick={() => onArchive?.(capture._id)}
                title="Archive"
              >
                <Archive size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
