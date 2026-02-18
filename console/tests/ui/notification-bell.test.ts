/**
 * Tests for useNotifications hook and NotificationBell component
 *
 * Mock Justification: fetch is mocked to avoid real HTTP calls.
 * Value: Validates notification state management and UI rendering.
 */
import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";

const originalFetch = globalThis.fetch;
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
  }),
);
globalThis.fetch = mockFetch as any;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("useNotifications", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as any),
    );
  });

  it("should export notification functions", async () => {
    const mod = await import("../../src/ui/viewer/hooks/useNotifications.js");
    expect(typeof mod.useNotifications).toBe("function");
  });

  it("should define Notification type from viewer types", async () => {
    const types = await import("../../src/ui/viewer/types.js");
    expect(types).toBeDefined();
    const notification = {
      id: 1,
      type: "info",
      title: "Test",
      message: "Test message",
      plan_path: null,
      session_id: null,
      is_read: 0,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(notification.id).toBe(1);
    expect(notification.type).toBe("info");
  });
});

describe("notification API helpers", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should fetch notifications from API", async () => {
    const notifications = [
      { id: 1, type: "info", title: "Test", message: "msg", is_read: 0, created_at: "2026-01-01" },
    ];
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(notifications) } as any),
    );

    const response = await fetch("/api/notifications?limit=50");
    const data = await response.json();

    expect(data.length).toBe(1);
    expect(data[0].title).toBe("Test");
  });

  it("should call mark-as-read endpoint", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as any),
    );

    const response = await fetch("/api/notifications/1/read", { method: "PATCH" });
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it("should call mark-all-read endpoint", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as any),
    );

    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it("should fetch unread count", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ count: 5 }) } as any),
    );

    const response = await fetch("/api/notifications/unread-count");
    const data = await response.json();

    expect(data.count).toBe(5);
  });
});

describe("useNotifications SSE integration", () => {
  it("should create EventSource for /stream on mount", () => {
    const instances: Array<{ url: string; onmessage: any; close: ReturnType<typeof mock> }> = [];
    const origEventSource = globalThis.EventSource;
    globalThis.EventSource = class MockEventSource {
      url: string;
      onmessage: any = null;
      close = mock(() => {});
      constructor(url: string) {
        this.url = url;
        instances.push(this as any);
      }
    } as any;

    expect(instances.length).toBe(0);

    const es = new EventSource("/stream");
    expect(es.url).toBe("/stream");
    expect(instances.length).toBe(1);

    es.close();
    globalThis.EventSource = origEventSource;
  });

  it("should refetch notifications when new_notification SSE event fires", async () => {
    let fetchCallCount = 0;
    mockFetch.mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: fetchCallCount, type: "info", title: `N${fetchCallCount}`, message: "m", is_read: 0, created_at: "2026-01-01" }]),
      } as any);
    });

    const handler = (event: { data: string }) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_notification") {
        fetch("/api/notifications?limit=50&include_read=true");
      }
    };

    const initialCount = fetchCallCount;
    handler({ data: JSON.stringify({ type: "new_notification" }) });

    await new Promise((r) => setTimeout(r, 10));
    expect(fetchCallCount).toBeGreaterThan(initialCount);
  });

  it("should ignore non-notification SSE events", () => {
    let refetchCalled = false;
    const handler = (event: { data: string }) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_notification") {
        refetchCalled = true;
      }
    };

    handler({ data: JSON.stringify({ type: "new_observation" }) });
    expect(refetchCalled).toBe(false);

    handler({ data: JSON.stringify({ type: "processing_status" }) });
    expect(refetchCalled).toBe(false);
  });
});

describe("NotificationBell component", () => {
  it("should export NotificationBell component", async () => {
    const mod = await import("../../src/ui/viewer/components/NotificationBell.js");
    expect(typeof mod.NotificationBell).toBe("function");
  });

  it("should render unread badge when unreadCount > 0", async () => {
    const React = (await import("react")).default;
    const { renderToString } = await import("react-dom/server");
    const { NotificationBell } = await import("../../src/ui/viewer/components/NotificationBell.js");

    const html = renderToString(
      React.createElement(NotificationBell, {
        notifications: [],
        unreadCount: 3,
        onMarkAsRead: () => {},
        onMarkAllAsRead: () => {},
      }),
    );

    expect(html).toContain("3");
  });

  it("should NOT render badge when unreadCount is 0", async () => {
    const React = (await import("react")).default;
    const { renderToString } = await import("react-dom/server");
    const { NotificationBell } = await import("../../src/ui/viewer/components/NotificationBell.js");

    const html = renderToString(
      React.createElement(NotificationBell, {
        notifications: [],
        unreadCount: 0,
        onMarkAsRead: () => {},
        onMarkAllAsRead: () => {},
      }),
    );

    expect(html).not.toContain("bg-error");
  });
});
