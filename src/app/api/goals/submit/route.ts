import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { addAuditLog, addNotification } from '@/lib/helpers';

export async function POST() {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const cycle = db.prepare('SELECT id FROM cycles WHERE is_active = 1').get() as { id: string } | undefined;
  if (!cycle) return NextResponse.json({ error: 'No active cycle' }, { status: 400 });

  // Get all draft/returned goals for this employee in active cycle
  const goals = db.prepare(
    `SELECT * FROM goals WHERE employee_id = ? AND cycle_id = ? AND status IN ('draft', 'returned')`
  ).all(session.user.id, cycle.id) as { id: string; weightage: number; title: string }[];

  if (goals.length === 0) {
    return NextResponse.json({ error: 'No goals to submit' }, { status: 400 });
  }

  if (goals.length > 8) {
    return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 });
  }

  // Also include already submitted/approved goals in weightage calc
  const allGoals = db.prepare(
    `SELECT weightage FROM goals WHERE employee_id = ? AND cycle_id = ? AND status NOT IN ('returned')`
  ).all(session.user.id, cycle.id) as { weightage: number }[];

  const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    return NextResponse.json({ error: `Total weightage must equal 100%. Current: ${totalWeightage}%` }, { status: 400 });
  }

  for (const g of goals) {
    if (g.weightage < 10) {
      return NextResponse.json({ error: `Goal "${g.title}" has weightage below 10%` }, { status: 400 });
    }
  }

  // Submit all draft goals
  const updateStmt = db.prepare(`UPDATE goals SET status = 'submitted', updated_at = datetime('now') WHERE id = ?`);
  const submit = db.transaction(() => {
    for (const g of goals) {
      updateStmt.run(g.id);
      addAuditLog('goal', g.id, 'submitted', session.user.id, 'draft', 'submitted');
    }
  });
  submit();

  // Notify manager
  const user = db.prepare('SELECT manager_id FROM users WHERE id = ?').get(session.user.id) as { manager_id: string | null };
  if (user?.manager_id) {
    addNotification(
      user.manager_id,
      'goal_submitted',
      'Goal Sheet Submitted',
      `${session.user.name} has submitted their goal sheet for review (${goals.length} goals).`,
      '/manager/approvals'
    );
  }

  return NextResponse.json({ message: `${goals.length} goals submitted successfully` });
}
