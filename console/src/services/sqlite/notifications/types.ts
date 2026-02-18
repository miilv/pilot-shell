/**
 * Type definitions for notification operations.
 */

/** Row returned from notifications table. */
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  plan_path: string | null;
  session_id: string | null;
  is_read: number;
  created_at: string;
}

/** Input for creating a notification. */
export interface CreateNotificationInput {
  type: string;
  title: string;
  message: string;
  plan_path?: string;
  session_id?: string;
}
