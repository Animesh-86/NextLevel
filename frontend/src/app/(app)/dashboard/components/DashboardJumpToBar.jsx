'use client';
import Link from 'next/link';
import { Inbox, FolderOpen, CalendarDays, Map, Target, Mic } from 'lucide-react';

const JUMP_LINKS = [
  { href: '/captures', label: 'Capture Hub', icon: Inbox },
  { href: '/vault', label: 'File Vault', icon: FolderOpen },
  { href: '/planner', label: 'Planner', icon: CalendarDays },
  { href: '/journey', label: 'Learning Journey', icon: Map },
  { href: '/test', label: 'Assessments', icon: Target },
  { href: '/interview', label: 'Mock Interview', icon: Mic }
];

export default function DashboardJumpToBar() {
  return (
    <footer style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      flexWrap: 'wrap', 
      paddingTop: '1.25rem',
      borderTop: '1px solid var(--border)'
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
        JUMP TO
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {JUMP_LINKS.map(item => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-strong)', 
                borderRadius: '999px', 
                padding: '0.45rem 1rem', 
                fontSize: '0.82rem', 
                fontWeight: 600, 
                color: 'var(--text)',
                textDecoration: 'none'
              }}
            >
              <Icon size={14} style={{ color: 'var(--text-muted)' }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
