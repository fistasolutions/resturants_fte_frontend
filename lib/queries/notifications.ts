/**
 * The notification inbox (SPEC-335 / backend SPEC-343), read once for both transports
 * (SPEC-230). Writes live in `services/notifications-actions.ts`.
 */
import { defineQuery } from "@/lib/query-def";
import type { NotificationInbox } from "@/types/notifications";

/** How often the bell looks for something new while the app is open. */
export const NOTIFICATIONS_POLL_MS = 60_000;

export const notificationPaths = {
  inbox: (limit = 20): string => `/notifications?limit=${limit}`,
} as const;

export const notificationQueries = {
  inbox: (limit = 20) =>
    defineQuery<NotificationInbox>(["notifications", "inbox", limit], (api) =>
      api<NotificationInbox>(notificationPaths.inbox(limit)),
    ),
} as const;
