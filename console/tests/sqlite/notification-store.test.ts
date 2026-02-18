/**
 * Tests for NotificationStore - notification CRUD operations
 *
 * Mock Justification: NONE (0% mock code)
 * - Uses real SQLite with ':memory:' - tests actual SQL and schema
 *
 * Value: Validates notification persistence layer
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { SessionStore } from "../../src/services/sqlite/SessionStore.js";
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../../src/services/sqlite/notifications/store.js";
import type { CreateNotificationInput } from "../../src/services/sqlite/notifications/types.js";

describe("NotificationStore", () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  const sampleInput: CreateNotificationInput = {
    type: "plan_approval",
    title: "Plan Needs Review",
    message: "Your approval is needed",
  };

  it("should create a notification", () => {
    const notification = createNotification(store.db, sampleInput);

    expect(notification).not.toBeNull();
    expect(notification.id).toBeGreaterThan(0);
    expect(notification.type).toBe("plan_approval");
    expect(notification.title).toBe("Plan Needs Review");
    expect(notification.message).toBe("Your approval is needed");
    expect(notification.is_read).toBe(0);
    expect(notification.created_at).toBeDefined();
  });

  it("should create a notification with optional fields", () => {
    const notification = createNotification(store.db, {
      ...sampleInput,
      plan_path: "docs/plans/test.md",
      session_id: "session-123",
    });

    expect(notification.plan_path).toBe("docs/plans/test.md");
    expect(notification.session_id).toBe("session-123");
  });

  it("should list notifications ordered by created_at DESC", () => {
    createNotification(store.db, { ...sampleInput, title: "First" });
    createNotification(store.db, { ...sampleInput, title: "Second" });
    createNotification(store.db, { ...sampleInput, title: "Third" });

    const notifications = getNotifications(store.db);

    expect(notifications.length).toBe(3);
    expect(notifications[0].title).toBe("Third");
    expect(notifications[2].title).toBe("First");
  });

  it("should respect limit parameter", () => {
    for (let i = 0; i < 10; i++) {
      createNotification(store.db, { ...sampleInput, title: `Notification ${i}` });
    }

    const notifications = getNotifications(store.db, 5);
    expect(notifications.length).toBe(5);
  });

  it("should filter out read notifications by default", () => {
    const n1 = createNotification(store.db, { ...sampleInput, title: "Unread" });
    const n2 = createNotification(store.db, { ...sampleInput, title: "Read" });
    markAsRead(store.db, n2.id);

    const unreadOnly = getNotifications(store.db);
    expect(unreadOnly.length).toBe(1);
    expect(unreadOnly[0].title).toBe("Unread");

    const all = getNotifications(store.db, 50, true);
    expect(all.length).toBe(2);
  });

  it("should mark a single notification as read", () => {
    const notification = createNotification(store.db, sampleInput);
    expect(notification.is_read).toBe(0);

    markAsRead(store.db, notification.id);

    const all = getNotifications(store.db, 50, true);
    expect(all[0].is_read).toBe(1);
  });

  it("should mark all notifications as read", () => {
    createNotification(store.db, { ...sampleInput, title: "A" });
    createNotification(store.db, { ...sampleInput, title: "B" });
    createNotification(store.db, { ...sampleInput, title: "C" });

    expect(getUnreadCount(store.db)).toBe(3);

    markAllAsRead(store.db);

    expect(getUnreadCount(store.db)).toBe(0);
  });

  it("should return unread count", () => {
    expect(getUnreadCount(store.db)).toBe(0);

    createNotification(store.db, sampleInput);
    createNotification(store.db, sampleInput);
    expect(getUnreadCount(store.db)).toBe(2);

    const n = createNotification(store.db, sampleInput);
    markAsRead(store.db, n.id);
    expect(getUnreadCount(store.db)).toBe(2);
  });

  it("should auto-cleanup beyond 500 rows", () => {
    for (let i = 0; i < 502; i++) {
      store.db
        .prepare(
          "INSERT INTO notifications (type, title, message, is_read, created_at) VALUES (?, ?, ?, 0, datetime('now', ? || ' seconds'))",
        )
        .run("info", `Notification ${i}`, "msg", i.toString());
    }

    createNotification(store.db, { ...sampleInput, title: "Trigger cleanup" });

    const count = store.db.prepare("SELECT COUNT(*) as cnt FROM notifications").get() as { cnt: number };
    expect(count.cnt).toBeLessThanOrEqual(500);
  });
});
