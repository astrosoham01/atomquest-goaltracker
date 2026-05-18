import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 as uuid } from 'uuid';
import { hashSync } from 'bcryptjs';

export async function GET(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const managerId = searchParams.get('managerId');

  let query = 'SELECT id, name, email, role, department, manager_id, avatar_color, created_at FROM users';
  const conditions: string[] = [];
  const params: string[] = [];

  if (role) { conditions.push('role = ?'); params.push(role); }
  if (managerId) { conditions.push('manager_id = ?'); params.push(managerId); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY name';

  const users = db.prepare(query).all(...params);
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, role, department, managerId } = body;

  if (!name || !email || !role || !department) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

  const id = uuid();
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, department, manager_id, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, hashSync('password123', 10), role, department, managerId || null, color);

  return NextResponse.json({ id, message: 'User created' });
}

export async function PUT(req: NextRequest) {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, role, department, managerId } = body;

  const db = getDb();
  db.prepare('UPDATE users SET name = ?, role = ?, department = ?, manager_id = ? WHERE id = ?')
    .run(name, role, department, managerId || null, id);

  return NextResponse.json({ message: 'User updated' });
}
