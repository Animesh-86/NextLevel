'use client';
import { Building2, Trash2, ExternalLink } from 'lucide-react';
import { statusColors, statusLabels, statusOrder } from './journeyConstants';

export default function ApplicationCard({ app, onDelete, onStatusChange }) {
  const appId = app.id || app._id;

  return (
    <div className="app-card">
      <div className="app-card-header">
        <div><Building2 size={16} /><strong>{app.company}</strong></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="app-status-badge" style={{ color: statusColors[app.status], borderColor: statusColors[app.status] }}>
            {statusLabels[app.status]}
          </span>
          <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} onClick={() => onDelete(appId)} title="Delete Application">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="app-card-role">{app.role}</div>
      <div className="app-card-meta">
        {app.location && <span>{app.location}</span>}
        {app.salary && <span>{app.salary}</span>}
        {app.type !== 'full-time' && <span className="badge">{app.type}</span>}
      </div>
      {app.url && <a href={app.url} target="_blank" rel="noopener" className="app-card-link"><ExternalLink size={12} /> View Posting</a>}
      {/* Timeline */}
      {app.timeline?.length > 0 && (
        <div className="app-timeline">
          {app.timeline.slice(-3).map((ev, i) => (
            <div key={i} className="app-timeline-item">
              <div className="app-timeline-dot" />
              <span>{ev.event}</span>
              <span className="app-timeline-date">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          ))}
        </div>
      )}
      {/* Status pipeline */}
      <div className="app-pipeline">
        {statusOrder.slice(0, 7).map(s => (
          <button key={s} className={`app-pipeline-step ${app.status === s ? 'active' : ''} ${statusOrder.indexOf(app.status) > statusOrder.indexOf(s) ? 'passed' : ''}`}
            onClick={() => onStatusChange(appId, s)} title={statusLabels[s]} style={{ '--step-color': statusColors[s] }} />
        ))}
      </div>
      
      {/* Terminal states */}
      {app.status !== 'rejected' && app.status !== 'ghosted' && app.status !== 'accepted' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => onStatusChange(appId, 'rejected')}>
            Mark Rejected
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => onStatusChange(appId, 'ghosted')}>
            Ghosted
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0', color: '#10b981', borderColor: '#10b981' }} onClick={() => onStatusChange(appId, 'accepted')}>
            Accepted
          </button>
        </div>
      )}
      {(app.status === 'rejected' || app.status === 'ghosted') && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0' }} onClick={() => onStatusChange(appId, 'applied')}>
            Revert Status
          </button>
        </div>
      )}
    </div>
  );
}
