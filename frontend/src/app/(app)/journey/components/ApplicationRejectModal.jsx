'use client';
import { X } from 'lucide-react';

export default function ApplicationRejectModal({
  rejectFlow,
  setRejectFlow,
  onConfirmReject,
}) {
  if (!rejectFlow.active) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        {!rejectFlow.completed ? (
          <>
            <div className="modal-header">
              <h2>Application Rejected</h2>
              <button className="icon-btn" onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}><X size={20} /></button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sorry to hear that. Any notes on why it was rejected? (Optional)</p>
              <textarea className="input" placeholder="e.g. They wanted more Python experience" value={rejectFlow.note} onChange={e => setRejectFlow(f => ({ ...f, note: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => {
                onConfirmReject(rejectFlow.appId, 'rejected');
                setRejectFlow(f => ({ ...f, completed: true }));
              }}>Save without Note</button>
              <button className="btn btn-primary" onClick={() => {
                onConfirmReject(rejectFlow.appId, 'rejected', rejectFlow.note);
                setRejectFlow(f => ({ ...f, completed: true }));
              }}>Save Note</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Keep Pushing!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Every &lsquo;No&rsquo; brings you one step closer to a &lsquo;Yes&rsquo;. Your next opportunity is out there.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setRejectFlow({ active: false, appId: null, note: '', completed: false })}>Got it</button>
          </div>
        )}
      </div>
    </div>
  );
}
