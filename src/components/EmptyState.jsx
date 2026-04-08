import { FileQuestion, Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon = FileQuestion, title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={48} strokeWidth={1} />
      </div>
      <h3 className="empty-state-title">{title || 'Nothing here yet'}</h3>
      <p className="empty-state-message">{message || 'Get started by creating your first item.'}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: '1rem' }}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
