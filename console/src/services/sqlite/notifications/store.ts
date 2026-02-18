/**
 * Notification store - CRUD operations for dashboard notifications.
 */

import { Database } from "bun:sqlite";
import type { Notification, CreateNotificationInput } from "./types.js";

const MAX_NOTIFICATIONS = 500;

/** Create a notification and auto-cleanup old rows beyond limit. */
export function createNotification(
  db: Database,
  input: CreateNotificationInput,
): Notification {
  const result = db
    .prepare(
      `INSERT INTO notifications (type, title, message, plan_path, session_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.type,
      input.title,
      input.message,
      input.plan_path ?? null,
      input.session_id ?? null,
    );

  db.prepare(
    `DELETE FROM notifications WHERE id NOT IN (
       SELECT id FROM notifications ORDER BY created_at DESC, id DESC LIMIT ?
     )`,
  ).run(MAX_NOTIFICATIONS);

  return db
    .prepare("SELECT * FROM notifications WHERE id = ?")
    .get(result.lastInsertRowid) as Notification;
}

/** Get notifications ordered by created_at DESC. */
export function getNotifications(
  db: Database,
  limit: number = 50,
  includeRead: boolean = false,
): Notification[] {
  if (includeRead) {
    return db
      .prepare(
        "SELECT * FROM notifications ORDER BY created_at DESC, id DESC LIMIT ?",
      )
      .all(limit) as Notification[];
  }
  return db
    .prepare(
      "SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC, id DESC LIMIT ?",
    )
    .all(limit) as Notification[];
}

/** Mark a single notification as read. */
export function markAsRead(db: Database, id: number): void {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
}

/** Mark all notifications as read. */
export function markAllAsRead(db: Database): void {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
}

/** Get count of unread notifications. */
export function getUnreadCount(db: Database): number {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0")
    .get() as {
    count: number;
  };
  return row.count;
}
