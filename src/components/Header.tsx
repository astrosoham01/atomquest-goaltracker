'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const pageTitles: Record<string, string> = {
  '/employee/dashboard': 'Dashboard',
  '/employee/goals': 'My Goals',
  '/employee/goals/create': 'Create Goal',
  '/employee/checkin': 'Quarterly Check-in',
  '/manager/dashboard': 'Team Dashboard',
  '/manager/approvals': 'Goal Approvals',
  '/manager/checkins': 'Team Check-ins',
  '/manager/shared-goals': 'Shared Goals',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/cycles': 'Cycle Management',
  '/admin/users': 'User Management',
  '/admin/thrust-areas': 'Thrust Areas',
  '/admin/reports': 'Reports',
  '/admin/audit': 'Audit Trail',
  '/admin/goals/unlock': 'Goal Unlock',
  '/admin/escalations': 'Escalations',
  '/admin/analytics': 'Analytics',
};

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
  link: string | null;
};

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  if (!session) return null;
  const title = pageTitles[pathname] || 'Dashboard';

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h2>{title}</h2>
        </div>
        <div className="header-right">
          <span className={`role-badge ${session.user.role}`}>
            {session.user.role}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {session.user.department}
          </span>
          <button
            className="header-btn"
            onClick={() => setShowNotifs(!showNotifs)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>
        </div>
      </header>

      {showNotifs && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Notifications</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowNotifs(false)}
            >
              ✕
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.is_read ? '' : 'unread'}`}
                onClick={async () => {
                  await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: n.id }),
                  });
                  fetchNotifs();
                }}
              >
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">
                  {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
