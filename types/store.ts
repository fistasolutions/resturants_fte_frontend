export type StoreConnectionStatus = "active" | "disconnected";

export interface StoreConnection {
  /** Store display name from Shopify (SPEC-030). */
  name: string;
  /** myshopify domain, e.g. "mystore.myshopify.com". */
  domain: string;
  status: StoreConnectionStatus;
  /** ISO timestamp of the last successful sync. */
  lastSyncAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface SystemStatus {
  apiStatus: "operational" | "degraded" | "down";
  /** ISO timestamp of the last successful sync. */
  lastSyncAt: string;
  syncSchedule: string;
  appVersion: string;
}

/** Daily executive report schedule (backend SPEC-022). */
export interface ReportSchedule {
  /** "HH:MM", 24-hour. */
  time: string;
  /** IANA zone the time is interpreted in ("UTC" for the default). */
  timezone: string;
  source: "default" | "custom";
  /** ISO timestamp (zone-offset aware) of the next scheduled run. */
  nextRunAt: string;
}

/** Unattended send of overdue/transfer/winback/dead-inventory alerts
 * (backend SPEC-065) — off by default; manual Send in Morning Brief is
 * the only path until the client opts in. */
/** Monday report card to every store manager (SPEC-241 / backend SPEC-248). */
export interface ManagerReportCardSchedule {
  enabled: boolean;
  /** "Monday" — fixed. */
  weekday: string;
  /** "07:00", 24-hour, store-local — fixed. */
  time: string;
  timezone: string;
  /** ISO timestamp of the next Monday run, or null while disabled. */
  nextRunAt: string | null;
}

/** Monday payable card to the owner (SPEC-310 / backend SPEC-307). Same shape as the
 * manager card — a fixed weekday and time, and one switch. */
export interface FinanceCardSchedule {
  enabled: boolean;
  /** "Monday" — fixed. */
  weekday: string;
  /** "07:30", 24-hour, store-local — fixed, half an hour after the manager card. */
  time: string;
  timezone: string;
  /** ISO timestamp of the next Monday run, or null while disabled. */
  nextRunAt: string | null;
}

export interface BriefAutoSendSchedule {
  enabled: boolean;
  /** "HH:MM", 24-hour. */
  time: string;
  /** IANA zone the time is interpreted in. */
  timezone: string;
  /** ISO timestamp of the next scheduled run, or null while disabled. */
  nextRunAt: string | null;
}

/** Per-location manager email (backend SPEC-056/057) — the single
 * manager-notification mechanism: dead-inventory alerts, overdue-order
 * sends, and warehouse-transfer sends all route to whichever location a
 * sheet is about, via this field. */
export interface LocationManager {
  locationId: number;
  name: string;
  managerEmail: string | null;
}
