'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type ThrustArea = { id: string; name: string; };

export default function CreateGoal() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [thrustAreas, setThrustAreas] = useState<ThrustArea[]>([]);
  const [form, setForm] = useState({
    thrustAreaId: '', title: '', description: '', uomType: 'numeric_min',
    targetValue: '', targetDate: '', weightage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/thrust-areas').then(r => r.json()).then(d => setThrustAreas(d.thrustAreas || []));
    if (editId) {
      fetch('/api/goals').then(r => r.json()).then(d => {
        const goal = (d.goals || []).find((g: { id: string }) => g.id === editId);
        if (goal) {
          setForm({
            thrustAreaId: goal.thrust_area_id, title: goal.title, description: goal.description || '',
            uomType: goal.uom_type, targetValue: goal.target_value?.toString() || '',
            targetDate: goal.target_date || '', weightage: goal.weightage.toString(),
          });
        }
      });
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);

    const payload = {
      ...(editId ? { id: editId } : {}),
      thrustAreaId: form.thrustAreaId,
      title: form.title,
      description: form.description,
      uomType: form.uomType,
      targetValue: form.uomType === 'timeline' ? null : parseFloat(form.targetValue) || null,
      targetDate: form.uomType === 'timeline' ? form.targetDate : null,
      weightage: parseFloat(form.weightage),
    };

    const res = await fetch('/api/goals', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    router.push('/employee/goals');
  };

  return (
    <div>
      <div className="page-header">
        <h1>{editId ? 'Edit Goal' : 'Create New Goal'}</h1>
        <p>Define your performance goal for this cycle</p>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Thrust Area *</label>
            <select className="form-select" value={form.thrustAreaId} onChange={e => setForm({ ...form, thrustAreaId: e.target.value })} required>
              <option value="">Select a thrust area</option>
              {thrustAreas.map(ta => <option key={ta.id} value={ta.id}>{ta.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className="form-input" placeholder="e.g., Increase quarterly sales revenue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe the goal, key milestones, and expected outcomes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unit of Measurement *</label>
              <select className="form-select" value={form.uomType} onChange={e => setForm({ ...form, uomType: e.target.value })} required>
                <option value="numeric_min">Numeric (Higher is better)</option>
                <option value="numeric_max">Numeric (Lower is better)</option>
                <option value="percent_min">Percentage (Higher is better)</option>
                <option value="percent_max">Percentage (Lower is better)</option>
                <option value="timeline">Timeline (Date-based)</option>
                <option value="zero">Zero-based (0 = Success)</option>
              </select>
              <span className="form-hint">
                {form.uomType === 'numeric_min' && 'Score = Achievement ÷ Target (e.g., Sales Revenue)'}
                {form.uomType === 'numeric_max' && 'Score = Target ÷ Achievement (e.g., TAT, Cost)'}
                {form.uomType === 'percent_min' && 'Score = Achievement ÷ Target (e.g., Conversion Rate)'}
                {form.uomType === 'percent_max' && 'Score = Target ÷ Achievement (e.g., Defect Rate)'}
                {form.uomType === 'timeline' && 'Score based on completion date vs deadline'}
                {form.uomType === 'zero' && 'If value = 0 → 100%, else 0% (e.g., Safety Incidents)'}
              </span>
            </div>

            <div className="form-group">
              {form.uomType === 'timeline' ? (
                <>
                  <label className="form-label">Target Date *</label>
                  <input type="date" className="form-input" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} required />
                </>
              ) : (
                <>
                  <label className="form-label">Target Value *</label>
                  <input type="number" className="form-input" placeholder={form.uomType.includes('percent') ? 'e.g., 95' : 'e.g., 5000000'} value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} required={form.uomType !== 'zero'} step="any" />
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Weightage (%) *</label>
            <input type="number" className="form-input" placeholder="Min 10%, Max 100%" value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })} min="10" max="100" step="5" required />
            <span className="form-hint">Minimum 10% per goal. Total across all goals must equal 100%.</span>
          </div>

          {error && <p className="form-error" style={{ marginBottom: 12 }}>❌ {error}</p>}

          <div className="btn-group" style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Goal' : 'Create Goal'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
