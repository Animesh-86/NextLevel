'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/useAuth';
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Play, Trophy, Home,
  UserCircle, Settings, LogOut, Menu, X, ChevronRight, Inbox,
  FolderOpen, CalendarDays, Map, Link2, Share2, Sparkles
} from 'lucide-react';
import ReminderBell from '@/components/ReminderBell';
import AiChatModal from '@/components/AiChatModal';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/captures', label: 'Capture Hub', icon: Inbox },
  { href: '/vault', label: 'File Vault', icon: FolderOpen },
  { href: '/planner', label: 'Planner', icon: CalendarDays },
  { href: '/journey', label: 'Journey', icon: Map },
  { href: '/graph', label: 'Knowledge Graph', icon: Share2 },
  { href: '/links', label: 'Links', icon: Link2 },
  { href: '/exams', label: 'Exams', icon: BookOpen, adminOnly: true },
  { href: '/manage', label: 'Question Bank', icon: Settings, adminOnly: true },
  { href: '/test', label: 'Focus Test', icon: Play },
  { href: '/results', label: 'Results', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const user = session?.user;
  const isAdmin = user?.role === 'admin';

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
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
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="sidebar-link-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-2">
          <button 
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Sparkles size={16} />
            <span className="font-medium">Ask AI</span>
          </button>
        </div>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {getInitials(user.name)}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">
                  <span className={`badge ${isAdmin ? 'badge-stark' : ''}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            className="sidebar-logout"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <AiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
