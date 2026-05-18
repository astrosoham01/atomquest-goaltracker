import { getDb } from './db';
import { hashSync } from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export function seedDatabase() {
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const adminId = uuid();
  const mgr1Id = uuid();
  const mgr2Id = uuid();
  const emp1Id = uuid();
  const emp2Id = uuid();
  const emp3Id = uuid();
  const emp4Id = uuid();
  const emp5Id = uuid();

  const password = hashSync('password123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, department, manager_id, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const users = [
    [adminId, 'Priya Sharma', 'admin@atomberg.com', password, 'admin', 'Human Resources', null, '#8b5cf6'],
    [mgr1Id, 'Rajesh Kumar', 'manager@atomberg.com', password, 'manager', 'Engineering', null, '#06b6d4'],
    [mgr2Id, 'Anita Desai', 'manager2@atomberg.com', password, 'manager', 'Sales', null, '#f59e0b'],
    [emp1Id, 'Arjun Mehta', 'employee@atomberg.com', password, 'employee', 'Engineering', mgr1Id, '#10b981'],
    [emp2Id, 'Sneha Patel', 'employee2@atomberg.com', password, 'employee', 'Engineering', mgr1Id, '#ec4899'],
    [emp3Id, 'Vikram Singh', 'employee3@atomberg.com', password, 'employee', 'Sales', mgr2Id, '#f97316'],
    [emp4Id, 'Kavita Rao', 'employee4@atomberg.com', password, 'employee', 'Sales', mgr2Id, '#6366f1'],
    [emp5Id, 'Amit Joshi', 'employee5@atomberg.com', password, 'employee', 'Engineering', mgr1Id, '#14b8a6'],
  ];

  const insertMany = db.transaction(() => {
    for (const u of users) {
      insertUser.run(...u);
    }
  });
  insertMany();

  // Thrust Areas
  const insertTA = db.prepare(
    'INSERT INTO thrust_areas (id, name, description, is_active) VALUES (?, ?, ?, 1)'
  );
  const thrustAreas = [
    [uuid(), 'Revenue Growth', 'Goals related to increasing revenue and market share'],
    [uuid(), 'Operational Excellence', 'Goals related to improving processes and efficiency'],
    [uuid(), 'Customer Satisfaction', 'Goals related to improving customer experience and NPS'],
    [uuid(), 'Innovation & Technology', 'Goals related to R&D, new products, and tech adoption'],
    [uuid(), 'People & Culture', 'Goals related to team development, engagement, and culture'],
    [uuid(), 'Cost Optimization', 'Goals related to reducing costs and improving margins'],
  ];
  const insertTAs = db.transaction(() => {
    for (const ta of thrustAreas) {
      insertTA.run(...ta);
    }
  });
  insertTAs();

  // Active Cycle
  const cycleId = uuid();
  db.prepare(
    'INSERT INTO cycles (id, name, year, phase, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).run(cycleId, 'FY 2026-27', 2026, 'goal_setting', '2026-05-01', '2027-04-30');

  console.log('Database seeded successfully!');
}
