'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Employee = { id: string; name: string; };
type ThrustArea = { id: string; name: string; };

export default function SharedGoals() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Employee[]>([]);
  const [thrustAreas, setThrustAreas] = useState<ThrustArea[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', description: '', thrustAreaId: '', uomType: 'numeric_min', targetValue: '', weightage: '10' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch(`/api/users?managerId=${session.user.id}`).then(r => r.json()),
      fetch('/api/thrust-areas').then(r => r.json()),
    ]).then(([ud, td]) => { setTeam(ud.users || []); setThrustAreas(td.thrustAreas || []); setLoading(false); });
  }, [session]);

  const toggleEmp = (id: string) => {
    setSelectedEmps(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (selectedEmps.length === 0) { setError('Select at least one employee'); return; }
    const res = await fetch('/api/goals/shared', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, targetValue: parseFloat(form.targetValue) || null, weightage: parseFloat(form.weightage), employeeIds: selectedEmps }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.message);
    setForm({ title: '', description: '', thrustAreaId: '', uomType: 'numeric_min', targetValue: '', weightage: '10' });
    setSelectedEmps([]);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Push Shared Goal</h1><p>Push a departmental KPI to multiple team members</p></div>

      {error && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)' }}><p style={{ color: 'var(--danger)', fontSize: 13 }}>❌ {error}</p></div>}
      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}><p style={{ color: 'var(--success)', fontSize: 13 }}>✅ {message}</p></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card">
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Thrust Area</label>
              <select className="form-select" value={form.thrustAreaId} onChange={e => setForm({ ...form, thrustAreaId: e.target.value })} required>
                <option value="">Select</option>
                {thrustAreas.map(ta => <option key={ta.id} value={ta.id}>{ta.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Goal Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">UoM</label>
                <select className="form-select" value={form.uomType} onChange={e => setForm({ ...form, uomType: e.target.value })}>
                  <option value="numeric_min">Numeric (Higher=Better)</option>
                  <option value="numeric_max">Numeric (Lower=Better)</option>
                  <option value="percent_min">% (Higher=Better)</option>
                  <option value="percent_max">% (Lower=Better)</option>
                  <option value="timeline">Timeline</option>
                  <option value="zero">Zero-based</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Target</label><input type="number" className="form-input" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} step="any" /></div>
            </div>
            <div className="form-group"><label className="form-label">Default Weightage (%)</label><input type="number" className="form-input" value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })} min="10" max="100" /></div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>🔗 Push to Selected Employees</button>
          </form>
        </div>

        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Select Employees ({selectedEmps.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {team.map(emp => (
              <label key={emp.id} className="card" style={{ padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: selectedEmps.includes(emp.id) ? '1px solid var(--accent)' : undefined }}>
                <input type="checkbox" checked={selectedEmps.includes(emp.id)} onChange={() => toggleEmp(emp.id)} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={() => setSelectedEmps(team.map(t => t.id))}>Select All</button>
        </div>
      </div>
    </div>
  );
}
