'use client';

import { Swords, FileText, MessageSquare } from 'lucide-react';

export default function RoomStageSwitcher({
  isChallengeActive,
  isMobile,
  messagesCount,
  activeTab,
  setActiveTab
}) {
  if (isChallengeActive) return null;

  const tabs = [
    { id: 'challenge', label: 'OA Blitz Arena', icon: Swords },
    { id: 'notes', label: 'Scratchpad', icon: FileText },
    ...(isMobile ? [{ id: 'chat', label: `Chat (${messagesCount})`, icon: MessageSquare }] : [])
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '0.45rem',
      borderBottom: '1px solid var(--border-light)',
      marginBottom: '0.85rem',
      gap: '0.75rem',
      flexWrap: 'wrap',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 600,
                border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                background: isActive ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? 'var(--brand-inverse)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
