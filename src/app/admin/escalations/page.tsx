'use client';

export default function EscalationsPage() {
  return (
    <div>
      <div className="page-header"><h1>Escalation Module</h1><p>Rule-based escalation tracking and management</p></div>

      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <div className="card stat-card amber">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Open Escalations</div>
          <div className="stat-value">0</div>
        </div>
        <div className="card stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Resolved</div>
          <div className="stat-value">0</div>
        </div>
        <div className="card stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Total Rules</div>
          <div className="stat-value">3</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Escalation Rules</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { name: 'Goal Not Submitted', desc: 'Employee has not submitted goals within 7 days of cycle open', trigger: '7 days after cycle opens', chain: 'Employee → Manager → HR' },
          { name: 'Goal Not Approved', desc: 'Manager has not approved goals within 5 days of submission', trigger: '5 days after submission', chain: 'Manager → Skip-level → HR' },
          { name: 'Check-in Not Completed', desc: 'Quarterly check-in not completed within the active window', trigger: '3 days before window closes', chain: 'Employee → Manager → HR' },
        ].map((rule, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{rule.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{rule.desc}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span>⏰ Trigger: <strong>{rule.trigger}</strong></span>
                  <span>🔗 Chain: <strong>{rule.chain}</strong></span>
                </div>
              </div>
              <span className="status status-approved">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
