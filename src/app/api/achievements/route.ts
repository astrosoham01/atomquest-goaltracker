import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuid } from 'uuid';
import { computeScore, addAuditLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('goalId');
  const employeeId = searchParams.get('employeeId') || session.user.id;

  if (goalId) {
    const achievements = db.prepare('SELECT * FROM goal_achievements WHERE goal_id = ? ORDER BY quarter').all(goalId);
    return NextResponse.json({ achievements });
  }

  // Get all achievements for an employee in active cycle
  const achievements = db.prepare(`
    SELECT ga.*, g.title as goal_title, g.uom_type, g.target_value, g.weightage
    FROM goal_achievements ga
    JOIN goals g ON ga.goal_id = g.id
    WHERE g.employee_id = ? AND g.cycle_id IN (SELECT id FROM cycles WHERE is_active = 1)
    ORDER BY ga.quarter, g.title
  `).all(employeeId);

  return NextResponse.json({ achievements });
}

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { goalId, quarter, actualValue, progressStatus, plannedValue } = body;

  if (!goalId || !quarter) {
    return NextResponse.json({ error: 'Goal ID and quarter required' }, { status: 400 });
  }

  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as {
    id: string; employee_id: string; uom_type: string; target_value: number | null; target_date: string | null; status: string;
  } | undefined;

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  if (!['approved', 'locked'].includes(goal.status)) {
    return NextResponse.json({ error: 'Goal must be approved to log achievements' }, { status: 400 });
  }

  const score = computeScore(goal.uom_type, goal.target_value, actualValue, goal.target_date);

  // Upsert
  const existing = db.prepare('SELECT id FROM goal_achievements WHERE goal_id = ? AND quarter = ?').get(goalId, quarter) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE goal_achievements SET actual_value = ?, planned_value = ?, progress_status = ?, computed_score = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(actualValue ?? null, plannedValue ?? null, progressStatus || 'on_track', score, existing.id);
  } else {
    db.prepare(
      `INSERT INTO goal_achievements (id, goal_id, quarter, planned_value, actual_value, progress_status, computed_score) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(uuid(), goalId, quarter, plannedValue ?? null, actualValue ?? null, progressStatus || 'not_started', score);
  }

  addAuditLog('achievement', goalId, 'achievement_logged', session.user.id, null, String(actualValue), `${quarter} update`);

  // If shared goal, sync to linked goals
  const linkedGoals = db.prepare('SELECT id FROM goals WHERE shared_from_goal_id = ?').all(goalId) as { id: string }[];
  for (const linked of linkedGoals) {
    const lexist = db.prepare('SELECT id FROM goal_achievements WHERE goal_id = ? AND quarter = ?').get(linked.id, quarter) as { id: string } | undefined;
    if (lexist) {
      db.prepare(`UPDATE goal_achievements SET actual_value = ?, computed_score = ?, updated_at = datetime('now') WHERE id = ?`).run(actualValue ?? null, score, lexist.id);
    } else {
      db.prepare(`INSERT INTO goal_achievements (id, goal_id, quarter, actual_value, computed_score) VALUES (?, ?, ?, ?, ?)`).run(uuid(), linked.id, quarter, actualValue ?? null, score);
    }
  }

  return NextResponse.json({ message: 'Achievement logged', score });
}
