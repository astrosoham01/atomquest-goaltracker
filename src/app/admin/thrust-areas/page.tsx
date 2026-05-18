'use client';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

type ThrustArea = { id: string; name: string; description: string; is_active: number; };

export default function ThrustAreasPage() {
  const [areas, setAreas] = useState<ThrustArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/thrust-areas').then(r => r.json()).then(d => { setAreas(d.thrustAreas || []); setLoading(false); }); }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Thrust Areas</h1><p>Organizational focus areas for goal alignment</p></div>
      <div className="grid grid-3">
        {areas.map(a => (
          <div key={a.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</h3>
              {a.is_active ? <span className="status status-approved">Active</span> : <span className="status status-draft">Inactive</span>}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.description || 'No description'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
