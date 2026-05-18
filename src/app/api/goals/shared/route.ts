import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuid } from 'uuid';
import { addAuditLog, addNotification } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || !['manager', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, thrustAreaId, uomType, targetValue, targetDate, weightage, employeeIds } = body;

  if (!title || !thrustAreaId || !uomType || !employeeIds?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const cycle = db.prepare('SELECT id FROM cycles WHERE is_active = 1').get() as { id: string };
  if (!cycle) return NextResponse.json({ error: 'No active cycle' }, { status: 400 });

  // Create primary goal (owned by first employee or manager)
  const primaryId = uuid();
  
  const insertGoal = db.prepare(
    `INSERT INTO goals (id, employee_id, cycle_id, thrust_area_id, title, description, uom_type, target_value, target_date, weightage, status, is_shared, shared_from_goal_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?)`
  );

  const createShared = db.transaction(() => {
    for (const empId of employeeIds) {
      const goalId = uuid();
      insertGoal.run(goalId, empId, cycle.id, thrustAreaId, title, description || null, uomType, targetValue || null, targetDate || null, weightage || 10, primaryId === goalId ? null : primaryId);
      
      addAuditLog('goal', goalId, 'shared_goal_created', session.user.id, null, title, `Shared to employee ${empId}`);
      addNotification(
        empId,
        'shared_goal',
        'Shared Goal Assigned',
        `A shared goal "${title}" has been assigned to you by ${session.user.name}. You may adjust the weightage.`,
        '/employee/goals'
      );
    }
  });
  createShared();

  return NextResponse.json({ message: `Shared goal pushed to ${employeeIds.length} employees` });
}
