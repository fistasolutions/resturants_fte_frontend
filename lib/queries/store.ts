/**
 * Store & user queries (SPEC-230) — the `/auth/me` and `/settings/status` reads the
 * app shell and the Dashboard header need, defined once for both transports. The
 * `ApiStatus` envelope lives here so `services/store.ts` (server) and these loaders
 * adapt the same shape.
 */
import { defineQuery } from "@/lib/query-def";
import type {
  BriefAutoSendSchedule,
  FinanceCardSchedule,
  ManagerReportCardSchedule,
  LocationManager,
  ReportSchedule,
  StoreConnection,
  SystemStatus,
  UserProfile,
} from "@/types/store";

export interface ApiLocationManager {
  location_id: number;
  name: string;
  manager_email: string | null;
}

/** The backend's `/settings/status` envelope (SPEC-017, SPEC-031). */
export interface ApiStatus {
  store: {
    domain: string;
    name: string;
    status: "active" | "disconnected";
    last_sync_at: string | null;
  };
  api_status: "operational" | "degraded" | "down";
  sync_schedule: string;
  app_version: string;
  report_schedule: {
    time: string;
    timezone: string;
    source: "default" | "custom";
    next_run_at: string;
  };
  brief_auto_send: {
    enabled: boolean;
    time: string;
    timezone: string;
    next_run_at: string | null;
  };
  /** SPEC-248 — absent on a backend that predates it, so every field is optional. */
  manager_report_card?: {
    enabled: boolean;
    weekday: string;
    time: string;
    timezone: string;
    next_run_at: string | null;
  };
  /** SPEC-307 — absent on a backend that predates it, so every field is optional. */
  finance_card?: {
    enabled: boolean;
    weekday: string;
    time: string;
    timezone: string;
    next_run_at: string | null;
  };
  location_managers: ApiLocationManager[];
  warehouse_email?: string | null;
  support_email?: string | null;
  returns_email?: string | null;
}

export const storePaths = {
  status: (): string => "/settings/status",
  me: (): string => "/auth/me",
} as const;

export function adaptStoreConnection(status: ApiStatus): StoreConnection {
  return {
    name: status.store.name,
    domain: status.store.domain,
    status: status.store.status,
    lastSyncAt: status.store.last_sync_at ?? "",
  };
}

export function adaptSystemStatus(status: ApiStatus): SystemStatus {
  return {
    apiStatus: status.api_status,
    lastSyncAt: status.store.last_sync_at ?? "",
    syncSchedule: status.sync_schedule,
    appVersion: status.app_version,
  };
}

/** Everything the Settings section needs from ONE /settings/status call (SPEC-031). */
export interface SettingsOverview {
  connection: StoreConnection;
  system: SystemStatus;
  reportSchedule: ReportSchedule;
  briefAutoSend: BriefAutoSendSchedule;
  managerReportCard: ManagerReportCardSchedule;
  financeCard: FinanceCardSchedule;
  locationManagers: LocationManager[];
  warehouseEmail: string | null;
  supportEmail: string | null;
  returnsEmail: string | null;
}

export function adaptSettingsOverview(status: ApiStatus): SettingsOverview {
  return {
    connection: adaptStoreConnection(status),
    system: adaptSystemStatus(status),
    reportSchedule: {
      time: status.report_schedule.time,
      timezone: status.report_schedule.timezone,
      source: status.report_schedule.source,
      nextRunAt: status.report_schedule.next_run_at,
    },
    briefAutoSend: {
      enabled: status.brief_auto_send.enabled,
      time: status.brief_auto_send.time,
      timezone: status.brief_auto_send.timezone,
      nextRunAt: status.brief_auto_send.next_run_at,
    },
    managerReportCard: {
      enabled: status.manager_report_card?.enabled ?? false,
      weekday: status.manager_report_card?.weekday ?? "Monday",
      time: status.manager_report_card?.time ?? "07:00",
      timezone: status.manager_report_card?.timezone ?? status.brief_auto_send.timezone,
      nextRunAt: status.manager_report_card?.next_run_at ?? null,
    },
    financeCard: {
      enabled: status.finance_card?.enabled ?? false,
      weekday: status.finance_card?.weekday ?? "Monday",
      time: status.finance_card?.time ?? "07:30",
      timezone: status.finance_card?.timezone ?? status.brief_auto_send.timezone,
      nextRunAt: status.finance_card?.next_run_at ?? null,
    },
    locationManagers: (status.location_managers ?? []).map((loc) => ({
      locationId: loc.location_id,
      name: loc.name,
      managerEmail: loc.manager_email,
    })),
    warehouseEmail: status.warehouse_email ?? null,
    supportEmail: status.support_email ?? null,
    returnsEmail: status.returns_email ?? null,
  };
}

export const storeQueries = {
  currentUser: () =>
    defineQuery<UserProfile>(["store", "current-user"], async (api) => {
      const user = await api<{ name: string; email: string }>(storePaths.me());
      return { name: user.name, email: user.email };
    }),
  connection: () =>
    defineQuery<StoreConnection>(["store", "connection"], async (api) =>
      adaptStoreConnection(await api<ApiStatus>(storePaths.status())),
    ),
  systemStatus: () =>
    defineQuery<SystemStatus>(["store", "system-status"], async (api) =>
      adaptSystemStatus(await api<ApiStatus>(storePaths.status())),
    ),
  /** One answer shared by the Settings layout and every Settings tab. */
  settingsOverview: () =>
    defineQuery<SettingsOverview>(["store", "settings-overview"], async (api) =>
      adaptSettingsOverview(await api<ApiStatus>(storePaths.status())),
    ),
} as const;
