'use client';
import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  open, 
  onConfirm, 
  onCancel, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true 
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary, #1a1a1a)',
          border: '1px solid var(--border-light, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '420px',
          margin: '0 1rem',
          animation: 'slideUp 0.2s ease-out',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} style={{ color: danger ? '#ef4444' : '#3b82f6' }} />
            </div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              color: 'var(--text-primary, #fff)', 
              margin: 0,
              lineHeight: 1.3,
            }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="icon-btn"
            style={{ padding: '4px', marginTop: '-4px', marginRight: '-4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p style={{ 
          color: 'var(--text-muted, #888)', 
          fontSize: '0.9rem', 
          lineHeight: 1.6, 
          margin: '0 0 1.5rem 0',
          paddingLeft: 'calc(40px + 0.75rem)',
        }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              fontSize: '0.875rem',
              padding: '0.5rem 1.25rem',
              background: danger ? '#ef4444' : 'var(--brand-purple)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
