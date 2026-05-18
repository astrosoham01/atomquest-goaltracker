import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  // All employees with their goal data
  const report = db.prepare(`
    SELECT 
      u.name as employee_name,
      u.department,
      g.title as goal_title,
      g.uom_type,
      g.target_value,
      g.weightage,
      g.status as goal_status,
      t.name as thrust_area,
      ga.quarter,
      ga.planned_value,
      ga.actual_value,
      ga.computed_score,
      ga.progress_status
    FROM goals g
    JOIN users u ON g.employee_id = u.id
    JOIN thrust_areas t ON g.thrust_area_id = t.id
    LEFT JOIN goal_achievements ga ON g.id = ga.goal_id
    WHERE g.cycle_id IN (SELECT id FROM cycles WHERE is_active = 1)
    ORDER BY u.name, g.title, ga.quarter
  `).all();

  // Completion stats
  const totalEmployees = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'employee'").get() as { c: number }).c;
  const submittedEmployees = (db.prepare(`
    SELECT COUNT(DISTINCT employee_id) as c FROM goals 
    WHERE cycle_id IN (SELECT id FROM cycles WHERE is_active = 1) 
    AND status IN ('submitted', 'approved', 'locked')
  `).get() as { c: number }).c;
  const approvedEmployees = (db.prepare(`
    SELECT COUNT(DISTINCT employee_id) as c FROM goals 
    WHERE cycle_id IN (SELECT id FROM cycles WHERE is_active = 1) 
    AND status IN ('approved', 'locked')
  `).get() as { c: number }).c;

  return NextResponse.json({
    report,
    stats: { totalEmployees, submittedEmployees, approvedEmployees }
  });
}
