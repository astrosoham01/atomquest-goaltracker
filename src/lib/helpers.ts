import { v4 as uuid } from 'uuid';
import { getDb } from './db';

export type GoalRow = {
  id: string;
  employee_id: string;
  cycle_id: string;
  thrust_area_id: string;
  title: string;
  description: string | null;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  status: string;
  is_shared: number;
  shared_from_goal_id: string | null;
  return_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  department: string;
  manager_id: string | null;
  avatar_color: string;
  created_at: string;
};

export type CycleRow = {
  id: string;
  name: string;
  year: number;
  phase: string;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
};

export type ThrustAreaRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at: string;
};

export type AchievementRow = {
  id: string;
  goal_id: string;
  quarter: string;
  planned_value: number | null;
  actual_value: number | null;
  progress_status: string;
  computed_score: number | null;
  updated_at: string;
};

export type CheckinRow = {
  id: string;
  goal_id: string;
  quarter: string;
  manager_id: string;
  comment: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  link: string | null;
  created_at: string;
};

export function computeScore(uomType: string, targetValue: number | null, actualValue: number | null, targetDate?: string | null, completionDate?: string | null): number {
  if (uomType === 'zero') {
    return actualValue === 0 ? 100 : 0;
  }

  if (uomType === 'timeline') {
    if (!targetDate || !completionDate) return 0;
    const target = new Date(targetDate).getTime();
    const completion = new Date(completionDate).getTime();
    if (completion <= target) return 100;
    const diff = (completion - target) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(100 - diff * 5));
  }

  if (targetValue === null || targetValue === 0 || actualValue === null) return 0;

  if (uomType === 'numeric_min' || uomType === 'percent_min') {
    return Math.min(100, Math.round((actualValue / targetValue) * 100));
  }

  if (uomType === 'numeric_max' || uomType === 'percent_max') {
    if (actualValue === 0) return 100;
    return Math.min(100, Math.round((targetValue / actualValue) * 100));
  }

  return 0;
}

export function addAuditLog(
  entityType: string,
  entityId: string,
  action: string,
  changedBy: string,
  oldValue?: string | null,
  newValue?: string | null,
  details?: string | null
) {
  const db = getDb();
  db.prepare(
    'INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, old_value, new_value, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(uuid(), entityType, entityId, action, changedBy, oldValue || null, newValue || null, details || null);
}

export function addNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  const db = getDb();
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uuid(), userId, type, title, message, link || null);
}

export function getActiveCycle(): CycleRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM cycles WHERE is_active = 1').get() as CycleRow | undefined;
}

export function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 7 && month <= 9) return 'q1';
  if (month >= 10 && month <= 12) return 'q2';
  if (month >= 1 && month <= 3) return 'q3';
  return 'q4';
}
