'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalEmployees: 0, submittedEmployees: 0, approvedEmployees: 0 });
  const [users, setUsers] = useState<{ id: string; name: string; role: string; department: string; avatar_color: string }[]>([]);
  const [cycle, setCycle] = useState<{ name: string; phase: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/cycles').then(r => r.json()),
    ]).then(([rData, uData, cData]) => {
      setStats(rData.stats || {});
      setUsers(uData.users || []);
      const active = (cData.cycles || []).find((c: { is_active: number }) => c.is_active);
      setCycle(active);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const managers = users.filter(u => u.role === 'manager');
  const employees = users.filter(u => u.role === 'employee');
  const departments = [...new Set(users.map(u => u.department))];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>{cycle ? `${cycle.name} — ${cycle.phase.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Phase` : 'No active cycle'}</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="card stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{stats.totalEmployees}</div>
        </div>
        <div className="card stat-card cyan">
          <div className="stat-icon">📤</div>
          <div className="stat-label">Goals Submitted</div>
          <div className="stat-value">{stats.submittedEmployees}</div>
        </div>
        <div className="card stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Goals Approved</div>
          <div className="stat-value">{stats.approvedEmployees}</div>
        </div>
        <div className="card stat-card amber">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.totalEmployees - stats.submittedEmployees}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Goal Submission Progress</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Submission Rate</span>
              <span style={{ fontWeight: 700 }}>{stats.totalEmployees ? Math.round((stats.submittedEmployees / stats.totalEmployees) * 100) : 0}%</span>
            </div>
            <div className="weightage-bar-track">
              <div className="weightage-bar-fill valid" style={{ width: `${stats.totalEmployees ? (stats.submittedEmployees / stats.totalEmployees) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Approval Rate</span>
              <span style={{ fontWeight: 700 }}>{stats.totalEmployees ? Math.round((stats.approvedEmployees / stats.totalEmployees) * 100) : 0}%</span>
            </div>
            <div className="weightage-bar-track">
              <div className="weightage-bar-fill valid" style={{ width: `${stats.totalEmployees ? (stats.approvedEmployees / stats.totalEmployees) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--accent), #a855f7)' }} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Organization Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{departments.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Departments</div>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{managers.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Managers</div>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{employees.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Employees</div>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{users.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
