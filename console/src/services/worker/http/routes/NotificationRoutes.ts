/**
 * Notification Routes
 *
 * CRUD endpoints for dashboard notifications.
 * Notifications are created by hooks/launcher and displayed in the viewer UI.
 */

import express, { Request, Response } from "express";
import { BaseRouteHandler } from "../BaseRouteHandler.js";
import type { DatabaseManager } from "../../DatabaseManager.js";
import type { SSEBroadcaster } from "../../SSEBroadcaster.js";
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../../../sqlite/notifications/store.js";

export class NotificationRoutes extends BaseRouteHandler {
  private dbManager: DatabaseManager | null;
  private sseBroadcaster: SSEBroadcaster | null;

  constructor(dbManager?: DatabaseManager, sseBroadcaster?: SSEBroadcaster) {
    super();
    this.dbManager = dbManager ?? null;
    this.sseBroadcaster = sseBroadcaster ?? null;
  }

  setupRoutes(app: express.Application): void {
    app.post(
      "/api/notifications",
      this.wrapHandler(this.handleCreate.bind(this)),
    );
    app.get("/api/notifications", this.wrapHandler(this.handleList.bind(this)));
    app.patch(
      "/api/notifications/:id/read",
      this.wrapHandler(this.handleMarkRead.bind(this)),
    );
    app.post(
      "/api/notifications/read-all",
      this.wrapHandler(this.handleMarkAllRead.bind(this)),
    );
    app.get(
      "/api/notifications/unread-count",
      this.wrapHandler(this.handleUnreadCount.bind(this)),
    );
  }

  private handleCreate(req: Request, res: Response): void {
    if (!this.validateRequired(req, res, ["type", "title", "message"])) return;
    if (
      String(req.body.title).length > 500 ||
      String(req.body.message).length > 2000
    ) {
      return this.badRequest(res, "Field too long");
    }

    const db = this.dbManager!.getSessionStore().db;
    const notification = createNotification(db, {
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      plan_path: req.body.planPath,
      session_id: req.body.sessionId,
    });

    this.sseBroadcaster?.broadcast({ type: "new_notification", notification });

    res.status(201).json(notification);
  }

  private handleList(req: Request, res: Response): void {
    const db = this.dbManager!.getSessionStore().db;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const includeRead = req.query.include_read === "true";

    const notifications = getNotifications(db, limit, includeRead);
    res.status(200).json(notifications);
  }

  private handleMarkRead(req: Request, res: Response): void {
    const id = this.parseIntParam(req, res, "id");
    if (id === null) return;

    const db = this.dbManager!.getSessionStore().db;
    markAsRead(db, id);
    res.status(200).json({ success: true });
  }

  private handleMarkAllRead(_req: Request, res: Response): void {
    const db = this.dbManager!.getSessionStore().db;
    markAllAsRead(db);
    res.status(200).json({ success: true });
  }

  private handleUnreadCount(_req: Request, res: Response): void {
    const db = this.dbManager!.getSessionStore().db;
    const count = getUnreadCount(db);
    res.status(200).json({ count });
  }
}
