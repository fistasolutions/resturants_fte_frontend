/** The notification bell's words (SPEC-335) — pure. */
import type { AppNotification } from "@/types/notifications";

/** "3", "9+", or null when there is nothing unread. */
export function badgeText(unread: number): string | null {
  if (unread <= 0) return null;
  return unread > 9 ? "9+" : String(unread);
}

export function bellLabel(unread: number): string {
  return unread > 0 ? `Notifications, ${unread} unread` : "Notifications";
}

/** Where a notification opens; a missing or outside link opens nothing. */
export function notificationHref(notification: AppNotification): string | null {
  return notification.href.startsWith("/") && !notification.href.startsWith("//") ? notification.href : null;
}

export const KIND_TONE: Record<string, "ok" | "ask" | "bad"> = {
  report_sent: "ok",
  report_needs_approval: "ask",
  report_failed: "bad",
};
