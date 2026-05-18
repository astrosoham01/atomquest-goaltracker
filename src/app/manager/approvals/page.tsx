'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Employee = { id: string; name: string; email: string; avatar_color: string; };
type Goal = {
  id: string; employee_id: string; title: string; description: string;
  thrust_area_name: string; uom_type: string; target_value: number;
  weightage: number; status: string;
};

const uomLabels: Record<string, string> = {
  numeric_min: 'Numeric ↑', numeric_max: 'Numeric ↓', percent_min: '% ↑', percent_max: '% ↓', timeline: 'Timeline', zero: 'Zero',
};

export default function ManagerApprovals() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/users?managerId=${session.user.id}`).then(r => r.json()).then(d => {
      setTeam(d.users || []);
      setLoading(false);
    });
  }, [session]);

  const loadGoals = async (empId: string) => {
    setSelectedEmp(empId);
    const res = await fetch(`/api/goals?employeeId=${empId}`);
    const data = await res.json();
    setGoals((data.goals || []).filter((g: Goal) => g.status === 'submitted'));
  };

  const handleAction = async (action: 'approve' | 'return') => {
    if (!selectedEmp) return;
    setProcessing(true); setError(''); setMessage('');
    const res = await fetch('/api/goals/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: selectedEmp, action, comment }),
    });
    const data = await res.json();
    setProcessing(false);
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.message);
    setGoals([]);
    setComment('');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Goal Approvals</h1>
        <p>Review and approve submitted goal sheets from your team</p>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)', background: 'rgba(239,68,68,.06)' }}><p style={{ color: 'var(--danger)', fontSize: 13 }}>❌ {error}</p></div>}
      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)', background: 'rgba(16,185,129,.06)' }}><p style={{ color: 'var(--success)', fontSize: 13 }}>✅ {message}</p></div>}

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 280, flexShrink: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Team Members</h3>
          {team.map(emp => (
            <div
              key={emp.id}
              className={`card`}
              style={{ marginBottom: 8, cursor: 'pointer', border: selectedEmp === emp.id ? '1px solid var(--accent)' : undefined, padding: 14 }}
              onClick={() => loadGoals(emp.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: emp.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14, flexShrink: 0 }}>
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {!selectedEmp ? (
            <div className="empty-state"><div className="icon">👈</div><h3>Select a team member</h3><p>Click on a team member to review their submitted goals.</p></div>
          ) : goals.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><h3>No pending approvals</h3><p>This team member has no submitted goals awaiting your review.</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{goals.length} Goals Submitted</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Weightage: {goals.reduce((s, g) => s + g.weightage, 0)}%</span>
              </div>

              <div className="table-container" style={{ marginBottom: 20 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Thrust Area</th>
                      <th>UoM</th>
                      <th>Target</th>
                      <th>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map(g => (
                      <tr key={g.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div>
                          {g.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{g.description}</div>}
                        </td>
                        <td><span style={{ fontSize: 12, color: 'var(--accent)' }}>{g.thrust_area_name}</span></td>
                        <td style={{ fontSize: 12 }}>{uomLabels[g.uom_type]}</td>
                        <td style={{ fontWeight: 600 }}>{g.target_value ?? '—'}</td>
                        <td style={{ fontWeight: 700 }}>{g.weightage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <label className="form-label">Comment (required for return)</label>
                <textarea className="form-textarea" placeholder="Add feedback or reason for returning..." value={comment} onChange={e => setComment(e.target.value)} />
              </div>

              <div className="btn-group">
                <button className="btn btn-success" onClick={() => handleAction('approve')} disabled={processing}>
                  {processing ? 'Processing...' : '✅ Approve & Lock'}
                </button>
                <button className="btn btn-danger" onClick={() => handleAction('return')} disabled={processing || !comment.trim()}>
                  ↩️ Return for Rework
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
