"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { integrationQueries } from "@/lib/queries/integrations";
import type { HubConnection } from "@/types/integrations";

export type SupportConnectionState = "loading" | "error" | "connected" | "not_connected";

export interface SupportConnection {
  state: SupportConnectionState;
  /** The Integrations hub's own Gorgias row — status, last sync, attention, account. */
  hub: HubConnection | null;
  error: Error | null;
  retry: () => void;
}

/**
 * The helpdesk connection, read from the Integrations hub (SPEC-346 decision 3): the same row
 * Integrations shows, so a store that connected Gorgias there is connected here, and nothing
 * asks twice. The read is shared through the cache with the Integrations page.
 */
export function useSupportConnection(): SupportConnection {
  const overview = useApiQuery(integrationQueries.overview());
  if (overview.isPending) return { state: "loading", hub: null, error: null, retry: () => void overview.refetch() };
  if (overview.isError) return { state: "error", hub: null, error: overview.error, retry: () => void overview.refetch() };
  const hub = overview.data.integrations.find((row) => row.key === "gorgias") ?? null;
  return {
    state: hub?.connected ? "connected" : "not_connected",
    hub,
    error: null,
    retry: () => void overview.refetch(),
  };
}
