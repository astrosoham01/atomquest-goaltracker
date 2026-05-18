import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { addAuditLog } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { goalId } = body;
  if (!goalId) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

  const db = getDb();
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as { id: string; status: string; title: string } | undefined;
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  if (!['approved', 'locked'].includes(goal.status)) {
    return NextResponse.json({ error: 'Only approved/locked goals can be unlocked' }, { status: 400 });
  }

  db.prepare(`UPDATE goals SET status = 'draft', updated_at = datetime('now') WHERE id = ?`).run(goalId);
  addAuditLog('goal', goalId, 'unlocked', session.user.id, goal.status, 'draft', `Admin unlocked goal: ${goal.title}`);

  return NextResponse.json({ message: 'Goal unlocked for editing' });
}
