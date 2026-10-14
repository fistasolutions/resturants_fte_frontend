"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useApiQuery } from "@/hooks/use-api-query";
import { FINANCE_KEY, financeQueries } from "@/lib/queries/finance";
import { connectionsPollInterval } from "@/lib/quickbooks-connection";

/**
 * The QuickBooks connections, re-read every 2 s while a company is being read and never
 * otherwise (SPEC-303). Integrations and Finance Oversight both read it, so they share one
 * cache entry and one poll. When the last read finishes, the rest of the finance cache is
 * refreshed — the bills that read just brought in appear without a reload.
 */
export function useQboConnections() {
  const queryClient = useQueryClient();
  const query = useApiQuery(financeQueries.connections(), {
    refetchInterval: (q) => connectionsPollInterval(q.state.data),
  });
  const syncing = query.data?.syncing ?? false;
  const wasSyncing = useRef(syncing);

  useEffect(() => {
    if (wasSyncing.current && !syncing) {
      void queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
    }
    wasSyncing.current = syncing;
  }, [syncing, queryClient]);

  return query;
}
