import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'goaltracker.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'manager', 'admin')),
      department TEXT NOT NULL DEFAULT 'General',
      manager_id TEXT,
      avatar_color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS thrust_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      phase TEXT NOT NULL CHECK(phase IN ('goal_setting', 'q1', 'q2', 'q3', 'q4', 'closed')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      cycle_id TEXT NOT NULL,
      thrust_area_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      uom_type TEXT NOT NULL CHECK(uom_type IN ('numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero')),
      target_value REAL,
      target_date TEXT,
      weightage REAL NOT NULL CHECK(weightage >= 10 AND weightage <= 100),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'returned', 'locked')),
      is_shared INTEGER DEFAULT 0,
      shared_from_goal_id TEXT,
      return_comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (cycle_id) REFERENCES cycles(id),
      FOREIGN KEY (thrust_area_id) REFERENCES thrust_areas(id),
      FOREIGN KEY (shared_from_goal_id) REFERENCES goals(id)
    );

    CREATE TABLE IF NOT EXISTS goal_achievements (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      quarter TEXT NOT NULL CHECK(quarter IN ('q1', 'q2', 'q3', 'q4')),
      planned_value REAL,
      actual_value REAL,
      progress_status TEXT DEFAULT 'not_started' CHECK(progress_status IN ('not_started', 'on_track', 'completed')),
      computed_score REAL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      UNIQUE(goal_id, quarter)
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      quarter TEXT NOT NULL CHECK(quarter IN ('q1', 'q2', 'q3', 'q4')),
      manager_id TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS escalations (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      condition_type TEXT NOT NULL CHECK(condition_type IN ('goal_not_submitted', 'goal_not_approved', 'checkin_not_completed')),
      threshold_days INTEGER NOT NULL DEFAULT 7,
      target_user_id TEXT NOT NULL,
      escalated_to TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'escalated')),
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (target_user_id) REFERENCES users(id),
      FOREIGN KEY (escalated_to) REFERENCES users(id)
    );
  `);
}
