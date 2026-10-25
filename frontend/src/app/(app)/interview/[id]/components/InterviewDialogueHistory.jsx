'use client';

import { MessageSquare } from 'lucide-react';

export default function InterviewDialogueHistory({ messages = [] }) {
  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        background: 'var(--surface-1, #101014)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={16} style={{ color: 'var(--text-muted, #a1a1ad)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f4f4f6' }}>
            Recent Dialogue History
          </span>
        </div>

        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #a1a1ad)', fontWeight: 500 }}>
          {messages.length} messages recorded
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.35rem' }}>
        {messages.map((m) => {
          const isInterviewer = m.role === 'interviewer';
          return (
            <div
              key={m.id}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: isInterviewer ? 'rgba(167, 139, 250, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                border: isInterviewer ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isInterviewer ? 'var(--ai, #a78bfa)' : 'var(--success, #34d399)'
                  }}
                >
                  {isInterviewer ? 'AI Lead Interviewer' : 'Candidate (You)'}
                </span>
              </div>
              <div style={{ fontSize: '0.86rem', color: '#e4e4e7', lineHeight: 1.5 }}>
                {m.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
