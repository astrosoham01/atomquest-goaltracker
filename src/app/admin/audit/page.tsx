'use client';
import { useEffect, useState } from 'react';

type AuditLog = { id: string; entity_type: string; entity_id: string; action: string; changed_by_name: string; old_value: string; new_value: string; details: string; created_at: string; };

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchLogs(); }, [filter]);
  const fetchLogs = async () => {
    const url = filter ? `/api/audit?action=${filter}` : '/api/audit';
    const r = await fetch(url); const d = await r.json(); setLogs(d.logs || []); setLoading(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const actions = ['created', 'updated', 'submitted', 'approved', 'returned', 'unlocked', 'deleted', 'achievement_logged', 'checkin_created', 'manager_edited', 'shared_goal_created'];

  return (
    <div>
      <div className="page-header"><h1>Audit Trail</h1><p>Complete log of all changes made to goals after lock date</p></div>

      <div className="filter-bar">
        <button className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('')}>All</button>
        {actions.map(a => (
          <button key={a} className={`btn ${filter === a ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(a)}>
            {a.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="empty-state"><div className="icon">🔍</div><h3>No audit logs yet</h3><p>Actions will appear here as users interact with the system.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{l.changed_by_name}</td>
                  <td><span className={`status status-${l.action.includes('approved') ? 'approved' : l.action.includes('returned') ? 'returned' : l.action.includes('submitted') ? 'submitted' : 'draft'}`}>{l.action.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 12 }}>{l.entity_type} <span style={{ color: 'var(--text-muted)' }}>#{l.entity_id.slice(0, 8)}</span></td>
                  <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.details || l.new_value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
