'use client';
import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const urgencyColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  none: 'var(--text-muted)',
};

export default function ReminderBell() {
  const [reminders, setReminders] = useState(null);
  const [open, setOpen] = useState(false);
  const [totalPending, setTotalPending] = useState(0);

  async function fetchReminders() {
    try {
      const res = await fetch('/api/captures/reminders');
      const data = await res.json();
      if (data.success) {
        setReminders(data.data);
        setTotalPending(data.data.totalPending || 0);
      }
    } catch (err) {
      // Silently fail
    }
  }

  useEffect(() => {
    fetchReminders();
    // Poll every 60 seconds
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  async function dismissReminder(id) {
    try {
      await fetch(`/api/captures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReminderDismissed: true }),
      });
      fetchReminders();
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  }

  const allItems = [
    ...(reminders?.overdue || []).map(r => ({ ...r, isOverdue: true })),
    ...(reminders?.upcoming || []),
  ];

  return (
    <div className="reminder-bell-container">
      <button
        className={`reminder-bell-btn ${totalPending > 0 ? 'has-pending' : ''}`}
        onClick={() => setOpen(!open)}
        title="Reminders"
      >
        <Bell size={18} />
        {totalPending > 0 && (
          <span className="reminder-bell-badge">{totalPending > 9 ? '9+' : totalPending}</span>
        )}
      </button>

      {open && (
        <>
          <div className="reminder-bell-overlay" onClick={() => setOpen(false)} />
          <div className="reminder-dropdown">
            <div className="reminder-dropdown-header">
              <h3>Reminders</h3>
              <Link href="/captures" className="reminder-view-all" onClick={() => setOpen(false)}>
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {allItems.length === 0 ? (
              <div className="reminder-empty">
                <Clock size={24} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No upcoming reminders</p>
              </div>
            ) : (
              <div className="reminder-list">
                {allItems.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    className={`reminder-item ${item.isOverdue ? 'overdue' : ''}`}
                  >
                    <div
                      className="reminder-item-indicator"
                      style={{ background: urgencyColors[item.urgency] || urgencyColors.none }}
                    />
                    <div className="reminder-item-content">
                      <div className="reminder-item-title">{item.title}</div>
                      <div className="reminder-item-time">
                        {item.isOverdue ? (
                          <><AlertTriangle size={11} /> Overdue</>
                        ) : (
                          <><Clock size={11} /> {new Date(item.reminderAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}</>
                        )}
                      </div>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => dismissReminder(item._id)}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
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
