'use client';

import { useEffect, useState } from 'react';

type User = { id: string; name: string; email: string; role: string; department: string; manager_id: string | null; avatar_color: string; };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', department: '', managerId: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { const r = await fetch('/api/users'); setUsers((await r.json()).users || []); setLoading(false); };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setMessage('User created! Default password: password123');
    setShowForm(false); setForm({ name: '', email: '', role: 'employee', department: '', managerId: '' }); fetchUsers();
    setTimeout(() => setMessage(''), 5000);
  };

  const managers = users.filter(u => u.role === 'manager');
  const filtered = filter ? users.filter(u => u.role === filter) : users;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-actions">
        <div><h1>User Management</h1><p>{users.length} users in the system</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>➕ Add User</button>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)' }}><p style={{ color: 'var(--danger)', fontSize: 13 }}>❌ {error}</p></div>}
      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}><p style={{ color: 'var(--success)', fontSize: 13 }}>✅ {message}</p></div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New User</h3>
          <form onSubmit={createUser}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required placeholder="Engineering" /></div>
            </div>
            {form.role === 'employee' && (
              <div className="form-group"><label className="form-label">Reporting Manager</label>
                <select className="form-select" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">None</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div className="btn-group"><button type="submit" className="btn btn-primary btn-sm">Create User</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button></div>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <button className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('')}>All</button>
        <button className={`btn ${filter === 'employee' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('employee')}>Employees</button>
        <button className={`btn ${filter === 'manager' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('manager')}>Managers</button>
        <button className={`btn ${filter === 'admin' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('admin')}>Admins</button>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, flexShrink: 0 }}>{u.name.charAt(0)}</div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{u.email}</td>
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td style={{ fontSize: 13 }}>{u.department}</td>
                <td style={{ fontSize: 13 }}>{u.manager_id ? users.find(m => m.id === u.manager_id)?.name || '—' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
