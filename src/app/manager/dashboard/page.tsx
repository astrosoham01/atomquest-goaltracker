'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Employee = { id: string; name: string; email: string; department: string; avatar_color: string; };
type Goal = { id: string; employee_id: string; title: string; status: string; weightage: number; };

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<Employee[]>([]);
  const [goalsByEmployee, setGoalsByEmployee] = useState<Record<string, Goal[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  const fetchData = async () => {
    const res = await fetch(`/api/users?managerId=${session?.user.id}`);
    const data = await res.json();
    const employees = data.users || [];
    setTeam(employees);

    const goalsMap: Record<string, Goal[]> = {};
    for (const emp of employees) {
      const gRes = await fetch(`/api/goals?employeeId=${emp.id}`);
      const gData = await gRes.json();
      goalsMap[emp.id] = gData.goals || [];
    }
    setGoalsByEmployee(goalsMap);
    setLoading(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const totalPending = Object.values(goalsByEmployee).reduce((sum, goals) => sum + goals.filter(g => g.status === 'submitted').length, 0);
  const totalApproved = Object.values(goalsByEmployee).reduce((sum, goals) => sum + goals.filter(g => ['approved', 'locked'].includes(g.status)).length, 0);
  const totalGoals = Object.values(goalsByEmployee).reduce((sum, goals) => sum + goals.length, 0);

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Team Dashboard</h1>
          <p>{team.length} direct reports</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => router.push('/manager/approvals')}>
            ✅ Pending Approvals {totalPending > 0 && `(${totalPending})`}
          </button>
          <button className="btn btn-secondary" onClick={() => router.push('/manager/shared-goals')}>🔗 Push Shared Goal</button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="card stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Team Size</div>
          <div className="stat-value">{team.length}</div>
        </div>
        <div className="card stat-card amber">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">{totalPending}</div>
        </div>
        <div className="card stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Approved Goals</div>
          <div className="stat-value">{totalApproved}</div>
        </div>
        <div className="card stat-card cyan">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">Total Goals</div>
          <div className="stat-value">{totalGoals}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Team Members</h3>
      <div className="grid grid-2">
        {team.map(emp => {
          const empGoals = goalsByEmployee[emp.id] || [];
          const pending = empGoals.filter(g => g.status === 'submitted').length;
          const approved = empGoals.filter(g => ['approved', 'locked'].includes(g.status)).length;
          const totalW = empGoals.reduce((s, g) => s + g.weightage, 0);

          return (
            <div key={emp.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/manager/approvals?employee=${emp.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: emp.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span>Goals: <strong>{empGoals.length}</strong></span>
                <span>Weightage: <strong style={{ color: totalW === 100 ? 'var(--success)' : 'var(--warning)' }}>{totalW}%</strong></span>
                {pending > 0 && <span className="status status-submitted">{pending} pending</span>}
                {approved > 0 && <span className="status status-approved">{approved} approved</span>}
              </div>
            </div>
          );
        })}
      </div>

      {team.length === 0 && (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No team members</h3>
          <p>No employees are assigned to you as direct reports.</p>
        </div>
      )}
    </div>
  );
}
