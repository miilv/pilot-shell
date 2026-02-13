/**
 * Tests for session cleanup: deleteSession must clean up pending messages.
 *
 * Mock Justification: DatabaseManager is stubbed (1 method) to provide
 * a real in-memory SessionStore. All SQL and queue operations use real SQLite.
 *
 * Value: Validates the critical bug fix where deleteSession was leaving orphaned
 * pending messages in the database, causing unbounded queue growth.
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { SessionManager } from "../../src/services/worker/SessionManager.js";
import { PendingMessageStore } from "../../src/services/sqlite/PendingMessageStore.js";

/**
 * Create a minimal in-memory DB with the pending_messages table
 * and a stub DatabaseManager that uses it.
 */
function createTestSetup() {
  const db = new Database(":memory:");
  db.run("PRAGMA journal_mode = WAL");
  db.run(`
    CREATE TABLE sdk_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_session_id TEXT UNIQUE NOT NULL,
      memory_session_id TEXT,
      project TEXT NOT NULL DEFAULT '',
      user_prompt TEXT DEFAULT '',
      started_at TEXT NOT NULL DEFAULT '',
      started_at_epoch INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      prompt_counter INTEGER DEFAULT 0
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
      failed_at_epoch INTEGER,
      FOREIGN KEY (session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE user_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_session_id TEXT NOT NULL,
      prompt_number INTEGER NOT NULL,
      prompt_text TEXT NOT NULL
    )
  `);

  db.run(`
    INSERT INTO sdk_sessions (id, content_session_id, memory_session_id, project, user_prompt, started_at, started_at_epoch)
    VALUES (1, 'test-csid-1', 'mem-1', 'test-project', 'test prompt', datetime('now'), ${Date.now()})
  `);
  db.run(`
    INSERT INTO sdk_sessions (id, content_session_id, memory_session_id, project, user_prompt, started_at, started_at_epoch)
    VALUES (2, 'test-csid-2', 'mem-2', 'test-project', 'test prompt 2', datetime('now'), ${Date.now()})
  `);

  const pendingStore = new PendingMessageStore(db, 3);

  const mockDbManager = {
    getSessionStore() {
      return {
        db,
        getSessionById(id: number) {
          const row = db.prepare("SELECT * FROM sdk_sessions WHERE id = ?").get(id) as any;
          return row || null;
        },
        getPromptNumberFromUserPrompts(_csid: string) {
          return 1;
        },
      };
    },
    getSessionById(id: number) {
      const row = db.prepare("SELECT * FROM sdk_sessions WHERE id = ?").get(id) as any;
      if (!row) throw new Error(`Session ${id} not found`);
      return row;
    },
  } as any;

  const sessionManager = new SessionManager(mockDbManager);

  return { db, pendingStore, sessionManager };
}

function enqueueTestMessage(pendingStore: PendingMessageStore, sessionDbId: number): number {
  return pendingStore.enqueue(sessionDbId, `test-csid-${sessionDbId}`, {
    type: "observation",
    tool_name: "Bash",
    tool_input: { command: "echo test" },
    tool_response: { output: "test" },
    prompt_number: 1,
    cwd: "/tmp",
  });
}

describe("Session cleanup on deleteSession", () => {
  let db: Database;
  let pendingStore: PendingMessageStore;
  let sessionManager: SessionManager;

  beforeEach(() => {
    const setup = createTestSetup();
    db = setup.db;
    pendingStore = setup.pendingStore;
    sessionManager = setup.sessionManager;
  });

  afterEach(() => {
    db.close();
  });

  it("deleteSession cleans up all pending messages for the session", async () => {
    sessionManager.initializeSession(1, "test prompt", 1);

    enqueueTestMessage(pendingStore, 1);
    enqueueTestMessage(pendingStore, 1);
    enqueueTestMessage(pendingStore, 1);
    expect(pendingStore.getPendingCount(1)).toBe(3);

    await sessionManager.deleteSession(1);

    expect(pendingStore.getPendingCount(1)).toBe(0);
    expect(pendingStore.hasAnyPendingWork()).toBe(false);
  });

  it("deleteSession does not affect pending messages from other sessions", async () => {
    sessionManager.initializeSession(1, "test prompt", 1);
    sessionManager.initializeSession(2, "test prompt 2", 1);

    enqueueTestMessage(pendingStore, 1);
    enqueueTestMessage(pendingStore, 1);
    enqueueTestMessage(pendingStore, 2);

    await sessionManager.deleteSession(1);

    expect(pendingStore.getPendingCount(1)).toBe(0);
    expect(pendingStore.getPendingCount(2)).toBe(1);
  });

  it("deleteSession removes session from active sessions map", async () => {
    sessionManager.initializeSession(1, "test prompt", 1);
    expect(sessionManager.getActiveSessionCount()).toBe(1);

    await sessionManager.deleteSession(1);

    expect(sessionManager.getActiveSessionCount()).toBe(0);
    expect(sessionManager.getSession(1)).toBeUndefined();
  });

  it("deleteSession is a no-op for non-existent sessions", async () => {
    enqueueTestMessage(pendingStore, 1);

    await sessionManager.deleteSession(999);

    expect(pendingStore.getPendingCount(1)).toBe(1);
  });

  it("hasAnyPendingWork returns false after all sessions with pending messages are deleted", async () => {
    sessionManager.initializeSession(1, "test prompt", 1);
    sessionManager.initializeSession(2, "test prompt 2", 1);

    enqueueTestMessage(pendingStore, 1);
    enqueueTestMessage(pendingStore, 2);
    expect(pendingStore.hasAnyPendingWork()).toBe(true);

    await sessionManager.deleteSession(1);
    expect(pendingStore.hasAnyPendingWork()).toBe(true);

    await sessionManager.deleteSession(2);
    expect(pendingStore.hasAnyPendingWork()).toBe(false);
  });
});
