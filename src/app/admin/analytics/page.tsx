'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [report, setReport] = useState<{ employee_name: string; department: string; goal_title: string; thrust_area: string; uom_type: string; computed_score: number; quarter: string; progress_status: string; weightage: number; }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setReport(d.report || []); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  // Analytics computations
  const thrustAreaCounts: Record<string, number> = {};
  const uomCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const deptScores: Record<string, { total: number; count: number }> = {};

  report.forEach(r => {
    thrustAreaCounts[r.thrust_area] = (thrustAreaCounts[r.thrust_area] || 0) + 1;
    uomCounts[r.uom_type] = (uomCounts[r.uom_type] || 0) + 1;
    if (r.progress_status) statusCounts[r.progress_status] = (statusCounts[r.progress_status] || 0) + 1;
    if (r.computed_score != null) {
      if (!deptScores[r.department]) deptScores[r.department] = { total: 0, count: 0 };
      deptScores[r.department].total += r.computed_score;
      deptScores[r.department].count++;
    }
  });

  const uomLabels: Record<string, string> = {
    numeric_min: 'Numeric ↑', numeric_max: 'Numeric ↓', percent_min: '% ↑', percent_max: '% ↓', timeline: 'Timeline', zero: 'Zero',
  };

  const maxTA = Math.max(...Object.values(thrustAreaCounts), 1);

  return (
    <div>
      <div className="page-header"><h1>Analytics Dashboard</h1><p>Organization-wide goal and performance analytics</p></div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Goal Distribution by Thrust Area</h3>
          {Object.entries(thrustAreaCounts).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
            <div key={area} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{area}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
              <div className="weightage-bar-track">
                <div className="weightage-bar-fill valid" style={{ width: `${(count / maxTA) * 100}%` }} />
              </div>
            </div>
          ))}
          {Object.keys(thrustAreaCounts).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>UoM Type Distribution</h3>
          <div className="grid grid-2" style={{ gap: 12 }}>
            {Object.entries(uomCounts).map(([type, count]) => (
              <div key={type} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{uomLabels[type] || type}</div>
              </div>
            ))}
          </div>
          {Object.keys(uomCounts).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Progress Status Breakdown</h3>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[['not_started', 'Not Started', 'var(--text-muted)'], ['on_track', 'On Track', 'var(--info)'], ['completed', 'Completed', 'var(--success)']].map(([key, label, color]) => (
              <div key={key} style={{ textAlign: 'center', flex: 1, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: color as string }}>{statusCounts[key] || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Average Score by Department</h3>
          {Object.entries(deptScores).map(([dept, data]) => {
            const avg = Math.round(data.total / data.count);
            return (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 100, fontSize: 13, fontWeight: 600 }}>{dept}</span>
                <div style={{ flex: 1 }}>
                  <div className="weightage-bar-track">
                    <div className={`weightage-bar-fill ${avg >= 75 ? 'valid' : avg >= 50 ? 'warning' : 'error'}`} style={{ width: `${avg}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, width: 40, textAlign: 'right' }}>{avg}%</span>
              </div>
            );
          })}
          {Object.keys(deptScores).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No scored data yet</p>}
        </div>
      </div>
    </div>
  );
}
