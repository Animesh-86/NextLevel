'use client';
import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const urgencyColors = {
  critical: 'var(--urgency-critical)',
  high: 'var(--urgency-high)',
  medium: 'var(--urgency-medium)',
  low: 'var(--urgency-low)',
  none: 'var(--text-muted)',
};

export default function ReminderBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    try {
      const res = await apiFetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }

      const countRes = await apiFetch('/api/notifications/unread-count');
      const countData = await countRes.json();
      if (countData.success) {
        setUnreadCount(countData.data || 0);
      }
    } catch (err) {
      // Silently fail
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotifications();
    }, 0);

    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  async function markAsRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await apiFetch(`/api/notifications/mark-all-read`, {
        method: 'PUT',
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }

  return (
    <div className="reminder-bell-container">
      <button
        className={`reminder-bell-btn ${unreadCount > 0 ? 'has-pending' : ''}`}
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="reminder-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="reminder-bell-overlay" onClick={() => setOpen(false)} />
          <div className="reminder-dropdown">
            <div className="reminder-dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="reminder-empty">
                <Bell size={24} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="reminder-list">
                {notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`reminder-item ${!notif.read ? 'overdue' : ''}`} // Using 'overdue' style for unread for now
                  >
                    <div
                      className="reminder-item-indicator"
                      style={{ background: notif.read ? 'transparent' : 'var(--urgency-high)' }}
                    />
                    <div className="reminder-item-content">
                      <div className="reminder-item-title">{notif.title}</div>
                      <div className="reminder-item-time" style={{ color: 'var(--text-secondary)' }}>
                        {notif.message}
                      </div>
                      <div className="reminder-item-time">
                        <Clock size={11} /> {new Date(notif.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.read && (
                      <button
                        className="icon-btn"
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
