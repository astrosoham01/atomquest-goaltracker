import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuid } from 'uuid';

export async function GET() {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const cycles = db.prepare('SELECT * FROM cycles ORDER BY year DESC, created_at DESC').all();
  return NextResponse.json({ cycles });
}

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, year, phase, startDate, endDate } = body;

  if (!name || !year || !phase || !startDate || !endDate) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO cycles (id, name, year, phase, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, 0)')
    .run(id, name, year, phase, startDate, endDate);

  return NextResponse.json({ id, message: 'Cycle created' });
}

export async function PUT(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, phase, isActive } = body;

  const db = getDb();
  if (isActive !== undefined) {
    if (isActive) {
      db.prepare('UPDATE cycles SET is_active = 0').run();
    }
    db.prepare('UPDATE cycles SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
  }
  if (phase) {
    db.prepare('UPDATE cycles SET phase = ? WHERE id = ?').run(phase, id);
  }

  return NextResponse.json({ message: 'Cycle updated' });
}
