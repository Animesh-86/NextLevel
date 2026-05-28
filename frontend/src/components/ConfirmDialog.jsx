'use client';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card card" onClick={(e) => e.stopPropagation()} style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="dialog-header">
          {danger && <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />}
          <h3 className="dialog-title">{title}</h3>
        </div>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
