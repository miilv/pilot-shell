/**
 * Tests for PendingMessageStore session cleanup methods
 *
 * Mock Justification: NONE (0% mock code)
 * - Uses real SQLite with ':memory:' - tests actual SQL and schema
 * - All cleanup operations tested against real database behavior
 *
 * Value: Validates that session deletion and generator failure properly clean up
 * pending messages, preventing the queue from growing unboundedly (bug fix).
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { PendingMessageStore } from "../../src/services/sqlite/PendingMessageStore.js";

function createTestDb(): Database {
  const db = new Database(":memory:");
  db.run("PRAGMA journal_mode = WAL");
  db.run(`
    CREATE TABLE sdk_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_session_id TEXT UNIQUE NOT NULL,
      project TEXT
    )
  `);
  db.run(`
    CREATE TABLE pending_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_db_id INTEGER NOT NULL,
      content_session_id TEXT NOT NULL,
      message_type TEXT NOT NULL CHECK(message_type IN ('observation', 'summarize')),
      tool_name TEXT,
      tool_input TEXT,
      tool_response TEXT,
      cwd TEXT,
      last_user_message TEXT,
      last_assistant_message TEXT,
      prompt_number INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'failed')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at_epoch INTEGER NOT NULL,
      started_processing_at_epoch INTEGER,
      completed_at_epoch INTEGER,
      failed_at_epoch INTEGER
    )
  `);
  return db;
}

function enqueueTestMessage(store: PendingMessageStore, sessionDbId: number, contentSessionId: string = "test-csid"): number {
  return store.enqueue(sessionDbId, contentSessionId, {
    type: "observation",
    tool_name: "Bash",
    tool_input: { command: "echo test" },
    tool_response: { output: "test" },
    prompt_number: 1,
    cwd: "/tmp",
  });
}

describe("PendingMessageStore", () => {
  let db: Database;
  let store: PendingMessageStore;

  beforeEach(() => {
    db = createTestDb();
    store = new PendingMessageStore(db, 3);
  });

  afterEach(() => {
    db.close();
  });

  describe("deleteAllForSession", () => {
    it("deletes all pending messages for a session", () => {
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 1);

      expect(store.getPendingCount(1)).toBe(3);

      const deleted = store.deleteAllForSession(1);

      expect(deleted).toBe(3);
      expect(store.getPendingCount(1)).toBe(0);
    });

    it("does not affect messages from other sessions", () => {
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 2);

      store.deleteAllForSession(1);

      expect(store.getPendingCount(1)).toBe(0);
      expect(store.getPendingCount(2)).toBe(1);
    });

    it("deletes failed messages for the session", () => {
      const msgId = enqueueTestMessage(store, 1);
      store.markFailed(msgId);
      store.markFailed(msgId);
      store.markFailed(msgId);
      store.markFailed(msgId);

      const msgs = store.getQueueMessages();
      expect(msgs.some((m) => m.id === msgId && m.status === "failed")).toBe(true);

      const deleted = store.deleteAllForSession(1);
      expect(deleted).toBe(1);
    });

    it("returns 0 when session has no messages", () => {
      const deleted = store.deleteAllForSession(999);
      expect(deleted).toBe(0);
    });
  });

  describe("markAllSessionMessagesFailed", () => {
    it("marks all pending messages as failed for a session", () => {
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 1);

      const failed = store.markAllSessionMessagesFailed(1);

      expect(failed).toBe(3);
      expect(store.getPendingCount(1)).toBe(0);

      const msgs = store.getQueueMessages();
      expect(msgs.filter((m) => m.session_db_id === 1 && m.status === "failed")).toHaveLength(3);
    });

    it("does not affect messages from other sessions", () => {
      enqueueTestMessage(store, 1);
      enqueueTestMessage(store, 2);

      store.markAllSessionMessagesFailed(1);

      expect(store.getPendingCount(1)).toBe(0);
      expect(store.getPendingCount(2)).toBe(1);
    });

    it("sets failed_at_epoch timestamp", () => {
      enqueueTestMessage(store, 1);
      const before = Date.now();

      store.markAllSessionMessagesFailed(1);

      const msgs = store.getQueueMessages();
      const failedMsg = msgs.find((m) => m.session_db_id === 1);
      expect(failedMsg).toBeDefined();
      expect(failedMsg!.status).toBe("failed");
      expect((failedMsg as any).failed_at_epoch).toBeGreaterThanOrEqual(before);
    });

    it("returns 0 when session has no pending messages", () => {
      const failed = store.markAllSessionMessagesFailed(999);
      expect(failed).toBe(0);
    });

    it("does not affect already-failed messages", () => {
      const msgId = enqueueTestMessage(store, 1);
      store.markFailed(msgId);
      store.markFailed(msgId);
      store.markFailed(msgId);
      store.markFailed(msgId);

      enqueueTestMessage(store, 1);

      const failed = store.markAllSessionMessagesFailed(1);
      expect(failed).toBe(1);
    });
  });
});
