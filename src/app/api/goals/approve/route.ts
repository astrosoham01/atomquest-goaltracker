import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { addAuditLog, addNotification } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { employeeId, action, comment, goalEdits } = body;
  // action: 'approve' or 'return'
  // goalEdits: [{goalId, targetValue, weightage}] - optional inline edits

  const db = getDb();
  const cycle = db.prepare('SELECT id FROM cycles WHERE is_active = 1').get() as { id: string };
  if (!cycle) return NextResponse.json({ error: 'No active cycle' }, { status: 400 });

  // Verify this employee reports to this manager
  const employee = db.prepare('SELECT * FROM users WHERE id = ? AND manager_id = ?').get(employeeId, session.user.id) as { id: string; name: string } | undefined;
  if (!employee) return NextResponse.json({ error: 'Not your direct report' }, { status: 403 });

  const goals = db.prepare(
    `SELECT * FROM goals WHERE employee_id = ? AND cycle_id = ? AND status = 'submitted'`
  ).all(employeeId, cycle.id) as { id: string; title: string; weightage: number }[];

  if (goals.length === 0) {
    return NextResponse.json({ error: 'No submitted goals to review' }, { status: 400 });
  }

  if (action === 'approve') {
    // Apply inline edits if any
    if (goalEdits && Array.isArray(goalEdits)) {
      for (const edit of goalEdits) {
        if (edit.goalId && (edit.targetValue !== undefined || edit.weightage !== undefined)) {
          const updates: string[] = [];
          const params: (string | number)[] = [];
          if (edit.targetValue !== undefined) { updates.push('target_value = ?'); params.push(edit.targetValue); }
          if (edit.weightage !== undefined) { updates.push('weightage = ?'); params.push(edit.weightage); }
          updates.push("updated_at = datetime('now')");
          params.push(edit.goalId);
          db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...params);
          addAuditLog('goal', edit.goalId, 'manager_edited', session.user.id, null, null, 'Inline edit during approval');
        }
      }
    }

    // Approve and lock all submitted goals
    const approve = db.transaction(() => {
      for (const g of goals) {
        db.prepare(`UPDATE goals SET status = 'approved', updated_at = datetime('now') WHERE id = ?`).run(g.id);
        addAuditLog('goal', g.id, 'approved', session.user.id, 'submitted', 'approved');
      }
    });
    approve();

    addNotification(
      employeeId,
      'goal_approved',
      'Goals Approved',
      `Your goal sheet has been approved by ${session.user.name}. Goals are now locked.`,
      '/employee/goals'
    );

    return NextResponse.json({ message: 'Goals approved and locked' });
  } else if (action === 'return') {
    const returnGoals = db.transaction(() => {
      for (const g of goals) {
        db.prepare(`UPDATE goals SET status = 'returned', return_comment = ?, updated_at = datetime('now') WHERE id = ?`).run(comment || 'Please review and resubmit', g.id);
        addAuditLog('goal', g.id, 'returned', session.user.id, 'submitted', 'returned', comment);
      }
    });
    returnGoals();

    addNotification(
      employeeId,
      'goal_returned',
      'Goals Returned for Rework',
      `${session.user.name} has returned your goal sheet: ${comment || 'Please review and resubmit'}`,
      '/employee/goals'
    );

    return NextResponse.json({ message: 'Goals returned for rework' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
