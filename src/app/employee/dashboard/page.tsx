'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Goal = {
  id: string; title: string; thrust_area_name: string; uom_type: string;
  target_value: number; weightage: number; status: string; is_shared: number;
};

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalWeightage, setTotalWeightage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<{ name: string; phase: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      const [goalsRes, cyclesRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/cycles'),
      ]);
      const goalsData = await goalsRes.json();
      const cyclesData = await cyclesRes.json();
      setGoals(goalsData.goals || []);
      setTotalWeightage(goalsData.totalWeightage || 0);
      const active = (cyclesData.cycles || []).find((c: { is_active: number }) => c.is_active);
      setCycle(active || null);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const drafted = goals.filter(g => g.status === 'draft').length;
  const submitted = goals.filter(g => g.status === 'submitted').length;
  const approved = goals.filter(g => ['approved', 'locked'].includes(g.status)).length;
  const returned = goals.filter(g => g.status === 'returned').length;

  const uomLabels: Record<string, string> = {
    numeric_min: 'Numeric (Min)', numeric_max: 'Numeric (Max)',
    percent_min: '% (Min)', percent_max: '% (Max)',
    timeline: 'Timeline', zero: 'Zero-based',
  };

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Welcome, {session?.user?.name?.split(' ')[0]} 👋</h1>
          <p>{cycle ? `${cycle.name} • ${cycle.phase.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Phase` : 'No active cycle'}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => router.push('/employee/goals/create')}>
            ➕ Create Goal
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/employee/goals')}>
            🎯 View Goals
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="card stat-card purple">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">Total Goals</div>
          <div className="stat-value">{goals.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>of 8 max</div>
        </div>
        <div className="card stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">{approved}</div>
        </div>
        <div className="card stat-card cyan">
          <div className="stat-icon">📤</div>
          <div className="stat-label">Submitted</div>
          <div className="stat-value">{submitted}</div>
        </div>
        <div className="card stat-card amber">
          <div className="stat-icon">📝</div>
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{drafted}</div>
        </div>
      </div>

      {returned > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid var(--danger)', background: 'rgba(239,68,68,.06)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>
            ⚠️ {returned} goal(s) returned for rework — please review and resubmit.
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Total Weightage</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: totalWeightage === 100 ? 'var(--success)' : 'var(--warning)' }}>
            {totalWeightage}%
          </span>
        </div>
        <div className="weightage-bar-track">
          <div
            className={`weightage-bar-fill ${totalWeightage === 100 ? 'valid' : totalWeightage > 100 ? 'error' : 'warning'}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          />
        </div>
        {totalWeightage !== 100 && (
          <p className="form-hint" style={{ marginTop: 6 }}>
            {totalWeightage < 100 ? `Add ${100 - totalWeightage}% more weightage to submit` : 'Total exceeds 100%!'}
          </p>
        )}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Goals</h3>
      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No goals yet</h3>
          <p>Start by creating your first goal for this cycle.</p>
          <button className="btn btn-primary" onClick={() => router.push('/employee/goals/create')}>Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {goals.slice(0, 6).map(g => (
            <div key={g.id} className="card goal-card">
              <div className="goal-header">
                <div>
                  <div className="goal-title">{g.title}</div>
                  <div className="goal-thrust">{g.thrust_area_name}</div>
                </div>
                <span className={`status status-${g.status}`}>{g.status}</span>
              </div>
              <div className="goal-meta">
                <div className="goal-meta-item">UoM: <strong>{uomLabels[g.uom_type] || g.uom_type}</strong></div>
                <div className="goal-meta-item">Target: <strong>{g.target_value ?? '—'}</strong></div>
                <div className="goal-meta-item">Weight: <strong>{g.weightage}%</strong></div>
              </div>
              {g.is_shared ? <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 8 }}>🔗 Shared Goal</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
