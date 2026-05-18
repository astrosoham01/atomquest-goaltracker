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
  const goalId = searchParams.get('goalId');
  const employeeId = searchParams.get('employeeId');

  if (goalId) {
    const checkins = db.prepare(`
      SELECT c.*, u.name as manager_name 
      FROM checkins c JOIN users u ON c.manager_id = u.id 
      WHERE c.goal_id = ? ORDER BY c.created_at DESC
    `).all(goalId);
    return NextResponse.json({ checkins });
  }

  if (employeeId) {
    const checkins = db.prepare(`
      SELECT c.*, u.name as manager_name, g.title as goal_title
      FROM checkins c 
      JOIN users u ON c.manager_id = u.id 
      JOIN goals g ON c.goal_id = g.id
      WHERE g.employee_id = ? AND g.cycle_id IN (SELECT id FROM cycles WHERE is_active = 1)
      ORDER BY c.created_at DESC
    `).all(employeeId);
    return NextResponse.json({ checkins });
  }

  return NextResponse.json({ checkins: [] });
}

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { goalId, quarter, comment } = body;

  if (!goalId || !quarter || !comment) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as { employee_id: string; title: string } | undefined;
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const id = uuid();
  db.prepare('INSERT INTO checkins (id, goal_id, quarter, manager_id, comment) VALUES (?, ?, ?, ?, ?)')
    .run(id, goalId, quarter, session.user.id, comment);

  addAuditLog('checkin', id, 'checkin_created', session.user.id, null, comment, `${quarter} check-in for ${goal.title}`);
  addNotification(goal.employee_id, 'checkin', 'Check-in Received', `${session.user.name} added a ${quarter.toUpperCase()} check-in comment for "${goal.title}".`, '/employee/checkin');

  return NextResponse.json({ id, message: 'Check-in logged' });
}
