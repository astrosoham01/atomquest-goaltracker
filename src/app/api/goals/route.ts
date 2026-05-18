import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuid } from 'uuid';
import { addAuditLog, addNotification } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId') || session.user.id;
  const cycleId = searchParams.get('cycleId');

  let query = `SELECT g.*, t.name as thrust_area_name, u.name as employee_name 
    FROM goals g 
    JOIN thrust_areas t ON g.thrust_area_id = t.id 
    JOIN users u ON g.employee_id = u.id 
    WHERE g.employee_id = ?`;
  const params: (string | number)[] = [employeeId];

  if (cycleId) {
    query += ' AND g.cycle_id = ?';
    params.push(cycleId);
  } else {
    query += ' AND g.cycle_id IN (SELECT id FROM cycles WHERE is_active = 1)';
  }

  query += ' ORDER BY g.created_at DESC';
  const goals = db.prepare(query).all(...params);

  const totalWeightage = (goals as { weightage: number }[]).reduce((sum, g) => sum + g.weightage, 0);

  return NextResponse.json({ goals, totalWeightage });
}

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { thrustAreaId, title, description, uomType, targetValue, targetDate, weightage } = body;

  if (!thrustAreaId || !title || !uomType || weightage === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (weightage < 10) {
    return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 });
  }

  const db = getDb();
  const cycle = db.prepare('SELECT id FROM cycles WHERE is_active = 1').get() as { id: string } | undefined;
  if (!cycle) return NextResponse.json({ error: 'No active cycle' }, { status: 400 });

  // Check max goals
  const goalCount = db.prepare(
    'SELECT COUNT(*) as count FROM goals WHERE employee_id = ? AND cycle_id = ? AND status != ?'
  ).get(session.user.id, cycle.id, 'returned') as { count: number };

  if (goalCount.count >= 8) {
    return NextResponse.json({ error: 'Maximum 8 goals allowed per cycle' }, { status: 400 });
  }

  // Check total weightage
  const existing = db.prepare(
    'SELECT COALESCE(SUM(weightage), 0) as total FROM goals WHERE employee_id = ? AND cycle_id = ? AND status NOT IN (?, ?)'
  ).get(session.user.id, cycle.id, 'returned', 'draft') as { total: number };

  // For draft goals, we just warn but allow
  const id = uuid();
  db.prepare(
    `INSERT INTO goals (id, employee_id, cycle_id, thrust_area_id, title, description, uom_type, target_value, target_date, weightage, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(id, session.user.id, cycle.id, thrustAreaId, title, description || null, uomType, targetValue || null, targetDate || null, weightage);

  addAuditLog('goal', id, 'created', session.user.id, null, title, `Weightage: ${weightage}%`);

  return NextResponse.json({ id, message: 'Goal created' });
}

export async function PUT(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, thrustAreaId, title, description, uomType, targetValue, targetDate, weightage } = body;

  if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as { status: string; employee_id: string; is_shared: number } | undefined;
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  // Only drafts and returned goals can be edited by employee
  if (session.user.role === 'employee') {
    if (!['draft', 'returned'].includes(goal.status)) {
      return NextResponse.json({ error: 'Cannot edit locked/approved goals' }, { status: 403 });
    }
    if (goal.employee_id !== session.user.id) {
      return NextResponse.json({ error: 'Not your goal' }, { status: 403 });
    }
    // Shared goals: only weightage editable
    if (goal.is_shared) {
      db.prepare('UPDATE goals SET weightage = ?, updated_at = datetime("now") WHERE id = ?').run(weightage, id);
      return NextResponse.json({ message: 'Weightage updated' });
    }
  }

  db.prepare(
    `UPDATE goals SET thrust_area_id = ?, title = ?, description = ?, uom_type = ?, target_value = ?, target_date = ?, weightage = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(thrustAreaId, title, description || null, uomType, targetValue || null, targetDate || null, weightage, id);

  addAuditLog('goal', id, 'updated', session.user.id, null, null, `Updated goal: ${title}`);

  return NextResponse.json({ message: 'Goal updated' });
}

export async function DELETE(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as { status: string; employee_id: string; title: string } | undefined;
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  if (goal.status !== 'draft' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Only draft goals can be deleted' }, { status: 403 });
  }

  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  addAuditLog('goal', id, 'deleted', session.user.id, goal.title, null);

  return NextResponse.json({ message: 'Goal deleted' });
}
