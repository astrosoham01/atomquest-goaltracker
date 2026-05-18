'use client';
import { useEffect, useState } from 'react';

type ReportRow = { employee_name: string; department: string; goal_title: string; uom_type: string; target_value: number; weightage: number; goal_status: string; thrust_area: string; quarter: string; planned_value: number; actual_value: number; computed_score: number; progress_status: string; };

export default function ReportsPage() {
  const [report, setReport] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState({ totalEmployees: 0, submittedEmployees: 0, approvedEmployees: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setReport(d.report || []); setStats(d.stats || {}); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const headers = ['Employee', 'Department', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weightage', 'Quarter', 'Planned', 'Actual', 'Score', 'Status'];
    const rows = report.map(r => [r.employee_name, r.department, r.goal_title, r.thrust_area, r.uom_type, r.target_value, r.weightage, r.quarter || '', r.planned_value || '', r.actual_value || '', r.computed_score || '', r.progress_status || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'achievement_report.csv'; a.click();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-actions">
        <div><h1>Reports</h1><p>Achievement reports and completion dashboards</p></div>
        <button className="btn btn-primary" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card green"><div className="stat-label">Submission Rate</div><div className="stat-value">{stats.totalEmployees ? Math.round((stats.submittedEmployees / stats.totalEmployees) * 100) : 0}%</div></div>
        <div className="card stat-card purple"><div className="stat-label">Approval Rate</div><div className="stat-value">{stats.totalEmployees ? Math.round((stats.approvedEmployees / stats.totalEmployees) * 100) : 0}%</div></div>
        <div className="card stat-card cyan"><div className="stat-label">Total Goals Tracked</div><div className="stat-value">{report.length}</div></div>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Employee</th><th>Dept</th><th>Goal</th><th>Thrust Area</th><th>Target</th><th>Wt%</th><th>Qtr</th><th>Actual</th><th>Score</th><th>Status</th></tr></thead>
          <tbody>
            {report.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data yet. Goals and achievements will appear here.</td></tr>
            ) : report.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{r.employee_name}</td>
                <td style={{ fontSize: 12 }}>{r.department}</td>
                <td style={{ fontSize: 13 }}>{r.goal_title}</td>
                <td style={{ fontSize: 12, color: 'var(--accent)' }}>{r.thrust_area}</td>
                <td style={{ fontWeight: 600 }}>{r.target_value ?? '—'}</td>
                <td>{r.weightage}%</td>
                <td style={{ fontSize: 12 }}>{r.quarter?.toUpperCase() || '—'}</td>
                <td style={{ fontWeight: 600 }}>{r.actual_value ?? '—'}</td>
                <td>{r.computed_score != null ? <span className={`score ${r.computed_score >= 75 ? 'score-high' : r.computed_score >= 50 ? 'score-mid' : 'score-low'}`} style={{ width: 36, height: 36, fontSize: 11 }}>{Math.round(r.computed_score)}%</span> : '—'}</td>
                <td>{r.progress_status ? <span className={`status status-${r.progress_status}`}>{r.progress_status.replace('_', ' ')}</span> : <span className="status status-draft">{r.goal_status}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
