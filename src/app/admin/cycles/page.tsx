'use client';

import { useEffect, useState } from 'react';

type Cycle = { id: string; name: string; year: number; phase: string; start_date: string; end_date: string; is_active: number; };

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', year: '2026', phase: 'goal_setting', startDate: '', endDate: '' });
  const [message, setMessage] = useState('');

  const phases = ['goal_setting', 'q1', 'q2', 'q3', 'q4', 'closed'];

  useEffect(() => { fetchCycles(); }, []);
  const fetchCycles = async () => { const r = await fetch('/api/cycles'); const d = await r.json(); setCycles(d.cycles || []); setLoading(false); };

  const createCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/cycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowForm(false); fetchCycles();
  };

  const updateCycle = async (id: string, updates: { phase?: string; isActive?: boolean }) => {
    await fetch('/api/cycles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    setMessage('Cycle updated!'); fetchCycles(); setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-actions">
        <div><h1>Cycle Management</h1><p>Create and manage performance review cycles</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>➕ New Cycle</button>
      </div>

      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}><p style={{ color: 'var(--success)', fontSize: 13 }}>✅ {message}</p></div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={createCycle}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="FY 2026-27" /></div>
              <div className="form-group"><label className="form-label">Year</label><input type="number" className="form-input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /></div>
            </div>
            <div className="btn-group"><button type="submit" className="btn btn-primary btn-sm">Create</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button></div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Cycle</th><th>Year</th><th>Phase</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {cycles.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.year}</td>
                <td>
                  <select className="form-select" style={{ width: 'auto', padding: '4px 28px 4px 8px', fontSize: 12 }} value={c.phase} onChange={e => updateCycle(c.id, { phase: e.target.value })}>
                    {phases.map(p => <option key={p} value={p}>{p.replace('_', ' ').replace(/\b\w/g, ch => ch.toUpperCase())}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>{c.start_date} — {c.end_date}</td>
                <td>{c.is_active ? <span className="status status-approved">Active</span> : <span className="status status-draft">Inactive</span>}</td>
                <td>
                  {!c.is_active ? <button className="btn btn-success btn-sm" onClick={() => updateCycle(c.id, { isActive: true })}>Activate</button>
                    : <button className="btn btn-secondary btn-sm" onClick={() => updateCycle(c.id, { isActive: false })}>Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
