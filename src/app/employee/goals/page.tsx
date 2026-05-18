'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Goal = {
  id: string; title: string; description: string; thrust_area_name: string;
  uom_type: string; target_value: number; target_date: string;
  weightage: number; status: string; is_shared: number; return_comment: string;
};

export default function EmployeeGoals() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalWeightage, setTotalWeightage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(data.goals || []);
    setTotalWeightage(data.totalWeightage || 0);
    setLoading(false);
  };

  const submitGoals = async () => {
    setSubmitting(true); setError(''); setMessage('');
    const res = await fetch('/api/goals/submit', { method: 'POST' });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }
    setMessage(data.message);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    fetchGoals();
  };

  const uomLabels: Record<string, string> = {
    numeric_min: 'Numeric (Higher is better)', numeric_max: 'Numeric (Lower is better)',
    percent_min: '% (Higher is better)', percent_max: '% (Lower is better)',
    timeline: 'Timeline', zero: 'Zero-based',
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const canSubmit = goals.some(g => ['draft', 'returned'].includes(g.status));
  const allDraftWeightage = goals.filter(g => g.status !== 'returned').reduce((s, g) => s + g.weightage, 0);

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>My Goals</h1>
          <p>{goals.length} goals • {totalWeightage}% weightage allocated</p>
        </div>
        <div className="btn-group">
          {goals.length < 8 && (
            <button className="btn btn-primary" onClick={() => router.push('/employee/goals/create')}>➕ Add Goal</button>
          )}
          {canSubmit && (
            <button
              className="btn btn-success"
              onClick={submitGoals}
              disabled={submitting || allDraftWeightage !== 100}
              title={allDraftWeightage !== 100 ? 'Total weightage must be 100%' : 'Submit for manager approval'}
            >
              {submitting ? 'Submitting...' : '📤 Submit All'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)', background: 'rgba(239,68,68,.06)' }}><p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>❌ {error}</p></div>}
      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)', background: 'rgba(16,185,129,.06)' }}><p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✅ {message}</p></div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Weightage Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: allDraftWeightage === 100 ? 'var(--success)' : 'var(--warning)' }}>{allDraftWeightage}% / 100%</span>
        </div>
        <div className="weightage-bar-track">
          <div className={`weightage-bar-fill ${allDraftWeightage === 100 ? 'valid' : allDraftWeightage > 100 ? 'error' : 'warning'}`} style={{ width: `${Math.min(allDraftWeightage, 100)}%` }} />
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No goals created yet</h3>
          <p>Create your goals for this performance cycle.</p>
          <button className="btn btn-primary" onClick={() => router.push('/employee/goals/create')}>Create First Goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {goals.map(g => (
            <div key={g.id} className="card goal-card">
              <div className="goal-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="goal-title">{g.title}</span>
                    {g.is_shared ? <span style={{ fontSize: 10, background: 'rgba(6,182,212,.15)', color: 'var(--info)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>SHARED</span> : null}
                  </div>
                  <div className="goal-thrust">{g.thrust_area_name}</div>
                  {g.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{g.description}</p>}
                </div>
                <span className={`status status-${g.status}`}>{g.status}</span>
              </div>

              {g.status === 'returned' && g.return_comment && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.08)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--danger)' }}>
                  <strong>Manager Feedback:</strong> {g.return_comment}
                </div>
              )}

              <div className="goal-meta">
                <div className="goal-meta-item">UoM: <strong>{uomLabels[g.uom_type]}</strong></div>
                <div className="goal-meta-item">Target: <strong>{g.uom_type === 'timeline' ? g.target_date : g.target_value ?? '—'}</strong></div>
                <div className="goal-meta-item">Weightage: <strong>{g.weightage}%</strong></div>
              </div>

              {['draft', 'returned'].includes(g.status) && (
                <div className="goal-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/employee/goals/create?edit=${g.id}`)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteGoal(g.id)}>🗑️ Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
