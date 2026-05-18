'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems: Record<string, { section: string; items: { label: string; href: string; icon: string; badge?: boolean }[] }[]> = {
  employee: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/employee/dashboard', icon: '📊' },
      ],
    },
    {
      section: 'Goals',
      items: [
        { label: 'My Goals', href: '/employee/goals', icon: '🎯' },
        { label: 'Create Goal', href: '/employee/goals/create', icon: '➕' },
      ],
    },
    {
      section: 'Performance',
      items: [
        { label: 'Check-ins', href: '/employee/checkin', icon: '📝' },
      ],
    },
  ],
  manager: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/manager/dashboard', icon: '📊' },
      ],
    },
    {
      section: 'Team',
      items: [
        { label: 'Approvals', href: '/manager/approvals', icon: '✅', badge: true },
        { label: 'Team Check-ins', href: '/manager/checkins', icon: '📋' },
        { label: 'Shared Goals', href: '/manager/shared-goals', icon: '🔗' },
      ],
    },
  ],
  admin: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      ],
    },
    {
      section: 'Management',
      items: [
        { label: 'Cycles', href: '/admin/cycles', icon: '🔄' },
        { label: 'Users', href: '/admin/users', icon: '👥' },
        { label: 'Thrust Areas', href: '/admin/thrust-areas', icon: '🏷️' },
      ],
    },
    {
      section: 'Governance',
      items: [
        { label: 'Reports', href: '/admin/reports', icon: '📈' },
        { label: 'Audit Trail', href: '/admin/audit', icon: '🔍' },
        { label: 'Goal Unlock', href: '/admin/goals/unlock', icon: '🔓' },
        { label: 'Escalations', href: '/admin/escalations', icon: '⚠️' },
      ],
    },
    {
      section: 'Analytics',
      items: [
        { label: 'Analytics', href: '/admin/analytics', icon: '📉' },
      ],
    },
  ],
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount] = useState(0);

  if (!session) return null;
  const role = session.user.role;
  const sections = navItems[role] || [];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">G</div>
        <div>
          <h1>GoalTracker</h1>
          <span>AtomQuest Portal</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.section} className="nav-section">
            <div className="nav-section-title">{sec.section}</div>
            {sec.items.map((item) => (
              <div
                key={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                onClick={() => router.push(item.href)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {item.badge && pendingCount > 0 && (
                  <span className="badge">{pendingCount}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar" style={{ background: session.user.avatarColor }}>
            {session.user.name?.charAt(0)}
          </div>
          <div className="user-info">
            <div className="user-name">{session.user.name}</div>
            <div className="user-role">{session.user.role}</div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
