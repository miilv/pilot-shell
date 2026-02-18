/**
 * Tests for NotificationRoutes
 *
 * Mock Justification: Minimal mocks for Express req/res and DatabaseManager.
 * SQLite operations tested via real :memory: DB in notification-store.test.ts.
 *
 * Value: Validates route registration, request handling, and response format.
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { SessionStore } from "../../src/services/sqlite/SessionStore.js";
import { NotificationRoutes } from "../../src/services/worker/http/routes/NotificationRoutes.js";
import { createNotification } from "../../src/services/sqlite/notifications/store.js";

describe("NotificationRoutes", () => {
  let store: SessionStore;
  let routes: NotificationRoutes;

  beforeEach(() => {
    store = new SessionStore(":memory:");
    const dbManager = { getSessionStore: () => store } as any;
    routes = new NotificationRoutes(dbManager);
  });

  afterEach(() => {
    store.close();
  });

  describe("route setup", () => {
    it("should register all notification routes", () => {
      const registered: string[] = [];
      const mockApp = {
        get: (path: string) => registered.push(`GET ${path}`),
        post: (path: string) => registered.push(`POST ${path}`),
        patch: (path: string) => registered.push(`PATCH ${path}`),
      };

      routes.setupRoutes(mockApp as any);

      expect(registered).toContain("POST /api/notifications");
      expect(registered).toContain("GET /api/notifications");
      expect(registered).toContain("PATCH /api/notifications/:id/read");
      expect(registered).toContain("POST /api/notifications/read-all");
      expect(registered).toContain("GET /api/notifications/unread-count");
    });
  });

  describe("POST /api/notifications", () => {
    it("should create a notification and return 201", async () => {
      const req = {
        body: { type: "plan_approval", title: "Plan Review", message: "Needs approval" },
      } as any;
      const res = createMockResponse();

      await callHandler(routes, "POST", "/api/notifications", req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.type).toBe("plan_approval");
    });

    it("should broadcast SSE event after creating notification", async () => {
      const broadcastCalls: any[] = [];
      const mockBroadcaster = { broadcast: (data: any) => broadcastCalls.push(data) };
      const dbManager = { getSessionStore: () => store } as any;
      const routesWithSSE = new NotificationRoutes(dbManager, mockBroadcaster as any);

      const req = {
        body: { type: "plan_approval", title: "SSE Test", message: "Broadcasting" },
      } as any;
      const res = createMockResponse();

      await callHandler(routesWithSSE, "POST", "/api/notifications", req, res);

      expect(broadcastCalls.length).toBe(1);
      expect(broadcastCalls[0].type).toBe("new_notification");
      expect(broadcastCalls[0].notification.title).toBe("SSE Test");
    });

    it("should return 400 when required fields missing", async () => {
      const req = { body: { type: "info" } } as any;
      const res = createMockResponse();

      await callHandler(routes, "POST", "/api/notifications", req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/notifications", () => {
    it("should return unread notifications by default", async () => {
      createNotification(store.db, { type: "info", title: "A", message: "msg" });
      createNotification(store.db, { type: "info", title: "B", message: "msg" });

      const req = { query: {} } as any;
      const res = createMockResponse();

      await callHandler(routes, "GET", "/api/notifications", req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should respect limit query param", async () => {
      for (let i = 0; i < 5; i++) {
        createNotification(store.db, { type: "info", title: `N${i}`, message: "msg" });
      }

      const req = { query: { limit: "2" } } as any;
      const res = createMockResponse();

      await callHandler(routes, "GET", "/api/notifications", req, res);

      expect(res.body.length).toBe(2);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      const n = createNotification(store.db, { type: "info", title: "Test", message: "msg" });

      const req = { params: { id: String(n.id) } } as any;
      const res = createMockResponse();

      await callHandler(routes, "PATCH", `/api/notifications/${n.id}/read`, req, res);

      expect(res.statusCode).toBe(200);
    });

    it("should return 400 for invalid id", async () => {
      const req = { params: { id: "abc" } } as any;
      const res = createMockResponse();

      await callHandler(routes, "PATCH", "/api/notifications/abc/read", req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      createNotification(store.db, { type: "info", title: "A", message: "msg" });
      createNotification(store.db, { type: "info", title: "B", message: "msg" });

      const req = {} as any;
      const res = createMockResponse();

      await callHandler(routes, "POST", "/api/notifications/read-all", req, res);

      expect(res.statusCode).toBe(200);

      const countReq = { query: {} } as any;
      const countRes = createMockResponse();
      await callHandler(routes, "GET", "/api/notifications/unread-count", countReq, countRes);
      expect(countRes.body.count).toBe(0);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should return unread count", async () => {
      createNotification(store.db, { type: "info", title: "A", message: "msg" });
      createNotification(store.db, { type: "info", title: "B", message: "msg" });

      const req = { query: {} } as any;
      const res = createMockResponse();

      await callHandler(routes, "GET", "/api/notifications/unread-count", req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });
});


function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    headersSent: false,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
}

async function callHandler(
  routes: NotificationRoutes,
  method: string,
  path: string,
  req: any,
  res: any,
) {
  const handlers: Record<string, Record<string, Function>> = {};
  const mockApp = {
    get: (p: string, handler: Function) => {
      handlers[`GET ${p}`] = { handler };
    },
    post: (p: string, handler: Function) => {
      handlers[`POST ${p}`] = { handler };
    },
    patch: (p: string, handler: Function) => {
      handlers[`PATCH ${p}`] = { handler };
    },
  };

  routes.setupRoutes(mockApp as any);

  const key =
    `${method} ${path}` in handlers
      ? `${method} ${path}`
      : Object.keys(handlers).find((k) => {
          const pattern = k.replace(/:(\w+)/g, "[^/]+");
          return new RegExp(`^${pattern}$`).test(`${method} ${path}`);
        });

  if (!key) throw new Error(`No handler for ${method} ${path}`);
  await handlers[key].handler(req, res);
}
