/**
 * useNotifications - manages notification state for the dashboard.
 *
 * Fetches notifications on mount, provides mark-as-read functions,
 * and exposes a refresh() method for SSE integration.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "../types";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  refresh: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/notifications?limit=50&include_read=true",
      );
      if (!response.ok) return;
      const data = await response.json();
      if (mountedRef.current) {
        setNotifications(data);
        setUnreadCount(
          data.filter((n: Notification) => n.is_read === 0).length,
        );
      }
    } catch (e) {}
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    const eventSource = new EventSource("/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification" && mountedRef.current) {
          fetchNotifications();
        }
      } catch (e) {}
    };

    return () => {
      mountedRef.current = false;
      eventSource.close();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
