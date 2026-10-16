'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/useAuth';
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Play,
  UserCircle, Settings, LogOut, Inbox,
  FolderOpen, CalendarDays, Sparkles, Cloud, Menu, Mic, Timer, Gamepad2,
  ArrowUpRight, Pause, Users
} from 'lucide-react';
import ReminderBell from '@/components/ReminderBell';
import AiChatModal from '@/components/AiChatModal';
import { useFocusTimer } from '@/lib/FocusContext';

const navGroups = [
  {
    label: 'Home',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/captures', label: 'Capture Hub', icon: Inbox },
      { href: '/library', label: 'Files & Links', icon: FolderOpen },
    ],
  },
  {
    label: 'Growth System',
    items: [
      { href: '/workspace', label: 'Planner & Knowledge', icon: CalendarDays },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/exams', label: 'Exams', icon: BookOpen, adminOnly: true },
      { href: '/manage', label: 'Question Bank', icon: Settings, adminOnly: true },
      { href: '/test', label: 'Focus Test', icon: Play },
      { href: '/interview', label: 'AI Interview', icon: Mic },
    ],
  },
  {
    label: 'Flow',
    items: [
      { href: '/focus', label: 'Focus Timer', icon: Timer },
      { href: '/rooms', label: 'Study Rooms', icon: Users },
      { href: '/arcade', label: 'Tech Bubble Pit', icon: Gamepad2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: UserCircle },
      { href: '/settings/integrations', label: 'Integrations', icon: Cloud },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = session?.user;
  const isAdmin = user?.role === 'admin';

  const {
    isRunning,
    timeLeft,
    duration,
    mode,
    selectedTaskTitle,
    handleTogglePlay,
    handleEndTimer
  } = useFocusTimer();

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((group) => group.items.length > 0);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleNavClick = (itemHref) => {
    setIsMobileMenuOpen(false);
    const isPracticeItem = (
      itemHref.startsWith('/test') ||
      itemHref.startsWith('/exams') ||
      itemHref.startsWith('/manage') ||
      itemHref.startsWith('/interview')
    );
    if (isRunning && isPracticeItem) {
      handleEndTimer('practice');
    }
  };

  return (
    <>
    {isMobileMenuOpen && (
      <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
    )}
    <button 
      className="mobile-menu-btn" 
      onClick={() => setIsMobileMenuOpen(true)}
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>

    <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <span className="sidebar-brand">NextLevel</span>
        </Link>
        <ReminderBell />
      </div>

      <nav className="sidebar-nav">
        {filteredGroups.map((group) => (
          <div className="sidebar-nav-group" key={group.label}>
            <div className="sidebar-nav-label">{group.label}</div>
            {group.items.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  onClick={() => handleNavClick(item.href)}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Round Clock Dial in Sidebar (Active outside /focus during running session) */}
        {isRunning && pathname !== '/focus' && (
          <div
            onClick={() => router.push('/focus')}
            style={{
              margin: '0 0 0.85rem 0',
              padding: '0.85rem 0.5rem',
              background: 'linear-gradient(180deg, rgba(16, 20, 28, 0.95) 0%, rgba(10, 11, 16, 0.98) 100%)',
              borderRadius: '16px',
              border: `1px solid ${isBreakMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.55), 0 0 20px ${isBreakMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(52, 211, 153, 0.12)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
            title="Active Focus Session — Click to return to Focus Room"
          >
            {/* Top Header Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 4px',
              marginBottom: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isBreakMode ? '#f59e0b' : '#34d399',
                  boxShadow: `0 0 6px ${isBreakMode ? '#f59e0b' : '#34d399'}`,
                  animation: 'pulse 2s infinite ease-in-out'
                }} />
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isBreakMode ? '#f59e0b' : '#34d399'
                }}>
                  {isBreakMode ? 'Rest Break' : 'Focus Mode'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.62rem'
              }}>
                <ArrowUpRight size={13} />
              </div>
            </div>

            {/* Round Clock Dial */}
            <div style={{
              position: 'relative',
              width: '92px',
              height: '92px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                {/* Background Track */}
                <circle
                  cx="46"
                  cy="46"
                  r="38"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="46"
                  cy="46"
                  r="38"
                  stroke={isBreakMode ? '#f59e0b' : '#34d399'}
                  strokeWidth="4.5"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) - (progressPercent / 100) * (2 * Math.PI * 38)}
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease',
                    filter: `drop-shadow(0 0 5px ${isBreakMode ? 'rgba(245, 158, 11, 0.55)' : 'rgba(52, 211, 153, 0.55)'})`
                  }}
                />
              </svg>

              {/* Center Digits */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                pointerEvents: 'none'
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: '1.1',
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {mins}:{secs}
                </span>
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  marginTop: '2px'
                }}>
                  Remaining
                </span>
              </div>
            </div>

            {/* Task label (if linked) */}
            {selectedTaskTitle && (
              <div style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '0.68rem',
                color: '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 4px',
                marginTop: '4px'
              }}>
                {selectedTaskTitle}
              </div>
            )}

            {/* Controls Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              width: '100%'
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePlay();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Pause size={11} fill="currentColor" />
                Pause
              </button>

              <span style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.45)',
                fontWeight: 500
              }}>
                Click to open
              </span>
            </div>
          </div>
        )}

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
    {!pathname?.startsWith('/interview') && !pathname?.startsWith('/rooms/') && (
      <>
        <AiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        {!chatOpen && (
          <button
            type="button"
            className="sidebar-ask-ai-fab"
            onClick={() => setChatOpen(true)}
            aria-label="Ask AI"
          >
            <Sparkles size={18} />
          </button>
        )}
      </>
    )}
    </>
  );
}
