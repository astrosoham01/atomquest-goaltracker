'use client';
import { useEffect, useState } from 'react';

type Goal = { id: string; title: string; status: string; weightage: number; employee_name: string; thrust_area_name: string; };

export default function GoalUnlockPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchGoals(); }, []);
  const fetchGoals = async () => {
    // Fetch all users, then all their goals
    const uRes = await fetch('/api/users?role=employee');
    const uData = await uRes.json();
    const allGoals: Goal[] = [];
    for (const u of uData.users || []) {
      const gRes = await fetch(`/api/goals?employeeId=${u.id}`);
      const gData = await gRes.json();
      for (const g of gData.goals || []) {
        if (['approved', 'locked'].includes(g.status)) {
          allGoals.push({ ...g, employee_name: u.name });
        }
      }
    }
    setGoals(allGoals);
    setLoading(false);
  };

  const unlockGoal = async (goalId: string) => {
    if (!confirm('Unlock this goal? The employee will be able to edit it.')) return;
    const res = await fetch('/api/goals/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goalId }) });
    const data = await res.json();
    setMessage(data.message || data.error);
    fetchGoals();
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Goal Unlock</h1><p>Unlock approved/locked goals for exception editing</p></div>
      {message && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}><p style={{ fontSize: 13 }}>{message}</p></div>}

      {goals.length === 0 ? (
        <div className="empty-state"><div className="icon">🔓</div><h3>No locked goals</h3><p>All goals are currently in draft or submitted state.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Goal</th><th>Thrust Area</th><th>Weightage</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {goals.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{g.employee_name}</td>
                  <td style={{ fontSize: 13 }}>{g.title}</td>
                  <td style={{ fontSize: 12, color: 'var(--accent)' }}>{g.thrust_area_name}</td>
                  <td>{g.weightage}%</td>
                  <td><span className={`status status-${g.status}`}>{g.status}</span></td>
                  <td><button className="btn btn-warning btn-sm" onClick={() => unlockGoal(g.id)}>🔓 Unlock</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
