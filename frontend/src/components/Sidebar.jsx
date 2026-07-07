'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/useAuth';
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Play, Trophy,
  UserCircle, Settings, LogOut, Inbox,
  FolderOpen, CalendarDays, Sparkles
} from 'lucide-react';
import ReminderBell from '@/components/ReminderBell';
import AiChatModal from '@/components/AiChatModal';

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
      { href: '/results', label: 'Results', icon: Trophy },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: UserCircle },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [chatOpen, setChatOpen] = useState(false);
  const user = session?.user;
  const isAdmin = user?.role === 'admin';

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

  return (
    <>
    <aside className="sidebar">
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
  );
}
