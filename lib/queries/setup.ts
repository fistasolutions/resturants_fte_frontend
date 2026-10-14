/**
 * The setup checklist's one read (SPEC-361): each integration's connection and first-sync facts,
 * from the Integrations hub's overview (backend SPEC-337), raw. It has its own key and no
 * adapters, because Setup is drawn on every page and the hub's registry carries the whole hub.
 */
import { defineQuery } from "@/lib/query-def";

/** Only the fields Setup reads; the hub sends more. */
export interface SetupSyncRow {
  key: string;
  connected: boolean;
  status: string;
  last_success_at: string | null;
  can_sync: boolean;
}

export const setupPaths = {
  sync: (): string => "/integrations/overview",
} as const;

export const setupQueries = {
  sync: () =>
    defineQuery<SetupSyncRow[]>(["setup", "sync"], async (api) => {
      const body = await api<{ integrations: SetupSyncRow[] }>(setupPaths.sync());
      return body.integrations.map(({ key, connected, status, last_success_at, can_sync }) => ({
        key,
        connected,
        status,
        last_success_at,
        can_sync,
      }));
    }),
} as const;
