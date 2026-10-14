/** The store's in-app inbox (SPEC-335 / backend SPEC-343). */
export type NotificationKind = "report_sent" | "report_needs_approval" | "report_failed";

export interface AppNotification {
  id: number;
  kind: NotificationKind | string;
  title: string;
  body: string;
  href: string;
  createdAt: string | null;
  read: boolean;
}

export interface NotificationInbox {
  unread: number;
  items: AppNotification[];
}
