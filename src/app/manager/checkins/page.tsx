'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Employee = { id: string; name: string; avatar_color: string; };
type Goal = { id: string; title: string; uom_type: string; target_value: number; weightage: number; };
type Achievement = { goal_id: string; quarter: string; actual_value: number | null; computed_score: number | null; progress_status: string; };

export default function ManagerCheckins() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('q1');
  const [comment, setComment] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) return;
    fetch(`/api/users?managerId=${session.user.id}`).then(r => r.json()).then(d => { setTeam(d.users || []); setLoading(false); });
  }, [session]);

  const loadEmployee = async (empId: string) => {
    setSelectedEmp(empId);
    const [gRes, aRes] = await Promise.all([
      fetch(`/api/goals?employeeId=${empId}`),
      fetch(`/api/achievements?employeeId=${empId}`),
    ]);
    const gData = await gRes.json();
    const aData = await aRes.json();
    setGoals((gData.goals || []).filter((g: { status: string }) => ['approved', 'locked'].includes(g.status)));
    setAchievements(aData.achievements || []);
  };

  const submitCheckin = async () => {
    if (!selectedGoal || !comment.trim()) return;
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId: selectedGoal, quarter, comment }),
    });
    if (res.ok) { setMessage('Check-in saved!'); setComment(''); setSelectedGoal(null); setTimeout(() => setMessage(''), 3000); }
  };

  const getAch = (goalId: string) => achievements.find(a => a.goal_id === goalId && a.quarter === quarter);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Team Check-ins</h1>
        <p>Review planned vs actual performance and add structured check-in comments</p>
      </div>

      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)', background: 'rgba(16,185,129,.06)' }}><p style={{ color: 'var(--success)', fontSize: 13 }}>✅ {message}</p></div>}

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['q1', 'q2', 'q3', 'q4'].map(q => (
          <button key={q} className={`tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>{q.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 240, flexShrink: 0 }}>
          {team.map(emp => (
            <div key={emp.id} className="card" style={{ marginBottom: 8, cursor: 'pointer', padding: 12, border: selectedEmp === emp.id ? '1px solid var(--accent)' : undefined }} onClick={() => loadEmployee(emp.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: emp.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13 }}>{emp.name.charAt(0)}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {!selectedEmp ? (
            <div className="empty-state"><div className="icon">👈</div><h3>Select a team member</h3></div>
          ) : goals.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>No approved goals</h3></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Goal</th><th>Target</th><th>Actual</th><th>Score</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {goals.map(g => {
                    const ach = getAch(g.id);
                    return (
                      <tr key={g.id}>
                        <td><div style={{ fontWeight: 600, fontSize: 13 }}>{g.title}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.weightage}% weight</div></td>
                        <td style={{ fontWeight: 600 }}>{g.target_value ?? '—'}</td>
                        <td style={{ fontWeight: 600 }}>{ach?.actual_value ?? '—'}</td>
                        <td>{ach?.computed_score != null ? <span className={`score ${ach.computed_score >= 75 ? 'score-high' : ach.computed_score >= 50 ? 'score-mid' : 'score-low'}`} style={{ width: 38, height: 38, fontSize: 12 }}>{Math.round(ach.computed_score)}%</span> : '—'}</td>
                        <td>{ach ? <span className={`status status-${ach.progress_status}`}>{ach.progress_status.replace('_', ' ')}</span> : <span className="status status-not_started">Not started</span>}</td>
                        <td><button className="btn btn-secondary btn-sm" onClick={() => setSelectedGoal(g.id)}>💬 Comment</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedGoal && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add Check-in Comment</h4>
              <textarea className="form-textarea" placeholder="Document the discussion, observations, and feedback..." value={comment} onChange={e => setComment(e.target.value)} />
              <div className="btn-group" style={{ marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={submitCheckin} disabled={!comment.trim()}>Save Comment</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedGoal(null); setComment(''); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
