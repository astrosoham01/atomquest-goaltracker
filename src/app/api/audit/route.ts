import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const entityType = searchParams.get('entityType');
  const action = searchParams.get('action');

  let query = `SELECT al.*, u.name as changed_by_name FROM audit_logs al JOIN users u ON al.changed_by = u.id`;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (entityType) { conditions.push('al.entity_type = ?'); params.push(entityType); }
  if (action) { conditions.push('al.action = ?'); params.push(action); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };

  return NextResponse.json({ logs, total: total.count, page, limit });
}
