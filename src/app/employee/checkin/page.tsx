'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Goal = {
  id: string; title: string; thrust_area_name: string; uom_type: string;
  target_value: number; weightage: number; status: string;
};
type Achievement = {
  goal_id: string; quarter: string; actual_value: number | null;
  progress_status: string; computed_score: number | null;
};

export default function EmployeeCheckin() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeQuarter, setActiveQuarter] = useState('q1');

  const quarters = ['q1', 'q2', 'q3', 'q4'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [gRes, aRes] = await Promise.all([fetch('/api/goals'), fetch('/api/achievements')]);
    const gData = await gRes.json();
    const aData = await aRes.json();
    setGoals((gData.goals || []).filter((g: Goal) => ['approved', 'locked'].includes(g.status)));
    setAchievements(aData.achievements || []);
    setLoading(false);
  };

  const getAchievement = (goalId: string, quarter: string) => {
    return achievements.find(a => a.goal_id === goalId && a.quarter === quarter);
  };

  const saveAchievement = async (goalId: string, quarter: string, actualValue: number | null, progressStatus: string) => {
    setSaving(goalId);
    const res = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, quarter, actualValue, progressStatus }),
    });
    const data = await res.json();
    setSaving(null);
    if (res.ok) { setMessage(`Score: ${data.score}%`); fetchData(); setTimeout(() => setMessage(''), 3000); }
  };

  const uomLabels: Record<string, string> = {
    numeric_min: 'Numeric ↑', numeric_max: 'Numeric ↓', percent_min: '% ↑', percent_max: '% ↓', timeline: 'Timeline', zero: 'Zero',
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Quarterly Check-in</h1>
        <p>Log your actual achievements against planned targets</p>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)', background: 'rgba(16,185,129,.06)' }}>
          <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✅ {message}</p>
        </div>
      )}

      <div className="tabs">
        {quarters.map(q => (
          <button key={q} className={`tab ${activeQuarter === q ? 'active' : ''}`} onClick={() => setActiveQuarter(q)}>
            {q.toUpperCase()}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <h3>No approved goals</h3>
          <p>Goals must be approved by your manager before you can log achievements.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {goals.map(g => {
            const ach = getAchievement(g.id, activeQuarter);
            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{g.title}</h3>
                    <span style={{ fontSize: 12, color: 'var(--accent)' }}>{g.thrust_area_name}</span>
                  </div>
                  {ach?.computed_score !== null && ach?.computed_score !== undefined && (
                    <div className={`score ${ach.computed_score >= 75 ? 'score-high' : ach.computed_score >= 50 ? 'score-mid' : 'score-low'}`}>
                      {Math.round(ach.computed_score)}%
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Target</label>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{g.target_value ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{uomLabels[g.uom_type]} • {g.weightage}% weight</div>
                  </div>
                  <div>
                    <label className="form-label">Actual Achievement</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter actual value"
                      defaultValue={ach?.actual_value ?? ''}
                      step="any"
                      onBlur={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : null;
                        saveAchievement(g.id, activeQuarter, val, ach?.progress_status || 'on_track');
                      }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      defaultValue={ach?.progress_status || 'not_started'}
                      onChange={(e) => saveAchievement(g.id, activeQuarter, ach?.actual_value ?? null, e.target.value)}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="on_track">On Track</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                {saving === g.id && <div className="animate-pulse" style={{ fontSize: 12, color: 'var(--accent)' }}>Saving...</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
