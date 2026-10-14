/**
 * Store & user service — server transport (SPEC-017, SPEC-031). The `/settings/status`
 * envelope and the reads the app shell + Dashboard share (`/auth/me`, the store
 * connection) are defined in `lib/queries/store.ts` since SPEC-230 so the client cache
 * refetches the same shapes; this module is their `serverApi` face.
 */
import { serverApi } from "@/lib/api";
import { storeQueries, type SettingsOverview } from "@/lib/queries/store";
import type { StoreConnection, SystemStatus, UserProfile } from "@/types/store";

export type { SettingsOverview } from "@/lib/queries/store";

export async function getStoreConnection(): Promise<StoreConnection> {
  return storeQueries.connection().load(serverApi);
}

export async function getCurrentUser(): Promise<UserProfile> {
  return storeQueries.currentUser().load(serverApi);
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return storeQueries.systemStatus().load(serverApi);
}

/** Everything the Settings page needs from ONE /settings/status call (SPEC-031). */
export async function getSettingsOverview(): Promise<SettingsOverview> {
  return storeQueries.settingsOverview().load(serverApi);
}
