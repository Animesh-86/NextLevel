'use client';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { PRESET_ROLES } from './interviewConstants';

export default function InterviewRoleSelector({
  selectedRoleId,
  setSelectedRoleId,
  setSelectedRole,
  customJD,
  setCustomJD,
}) {
  return (
    <section className="glass-panel" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <Briefcase size={18} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select Target Role</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
        {PRESET_ROLES.map((role) => {
          const isSelected = selectedRoleId === role.id;
          return (
            <div
              key={role.id}
              onClick={() => { setSelectedRoleId(role.id); setSelectedRole(role.title); }}
              style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                background: isSelected ? 'var(--accent-tint, rgba(245, 166, 35, 0.1))' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelected ? 'var(--accent-border, rgba(245, 166, 35, 0.4))' : 'var(--border-light)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '52px',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {role.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {role.category}
                </span>
                {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--accent, #f5a623)' }} />}
              </div>
            </div>
          );
        })}
      </div>

      {selectedRoleId === 'custom-jd' && (
        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Paste Job Description or Requirements
          </label>
          <textarea
            value={customJD}
            onChange={(e) => setCustomJD(e.target.value)}
            placeholder="Paste the target job description (skills, responsibilities, company tech stack)..."
            rows={4}
            style={{
              width: '100%', padding: '0.85rem 1rem',
              background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
              borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit'
            }}
          />
        </div>
      )}
    </section>
  );
}
