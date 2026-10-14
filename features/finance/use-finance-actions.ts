"use client";

import { useCallback, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FINANCE_KEY, financeQueries } from "@/lib/queries/finance";
import { returnCookie, SYNC_PEEK_MS } from "@/lib/quickbooks-connection";
import {
  disconnectAllQuickBooks,
  disconnectQuickBooks,
  quickBooksAuthorizeUrl,
  setExchangeRate,
  syncQuickBooks,
} from "@/services/finance-actions";

/**
 * Finance Oversight's three actions — connect, sync now, disconnect — in one place, so
 * the header, the connection line and the Integrations card behave identically. Every
 * write refreshes the whole `["finance"]` cache: one read of QuickBooks changes figures
 * on every tab.
 */
export function useFinanceActions() {
  const queryClient = useQueryClient();
  const [syncing, startSync] = useTransition();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      // Started here, so the callback returns here (SPEC-303 — forget an Integrations start).
      document.cookie = returnCookie(null);
      window.location.assign(await quickBooksAuthorizeUrl());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach QuickBooks.");
      setConnecting(false);
    }
  }, []);

  const sync = useCallback(() => {
    setError(null);
    startSync(async () => {
      try {
        const running = syncQuickBooks();
        // The read has started server-side and marked its companies: pick that up so
        // the bars appear and poll while it runs (SPEC-303), rather than only at the end.
        const peek = setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: financeQueries.connections().queryKey });
        }, SYNC_PEEK_MS);
        const result = await running.finally(() => clearTimeout(peek));
        const failed = result.companies.filter((company) => company.error);
        if (result.busy) setError(result.message ?? "These books are already being read — try again in a minute.");
        else if (failed.length) setError(failed.map((c) => `${c.company}: ${c.error}`).join(" · "));
        await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Syncing QuickBooks failed.");
      }
    });
  }, [queryClient]);

  const disconnect = useCallback(
    async (connectionId: number) => {
      setError(null);
      try {
        await disconnectQuickBooks(connectionId);
        await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Disconnecting the company failed.");
      }
    },
    [queryClient],
  );

  // SPEC-331: every company at once, behind its own typed confirmation.
  const disconnectAll = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      await disconnectAllQuickBooks();
      await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnecting the companies failed.");
      return false;
    }
  }, [queryClient]);

  // SPEC-331: a rate for a currency QuickBooks cannot quote; the next read includes the
  // company that was waiting for it, so a read starts straight away.
  const setRate = useCallback(
    async (currency: string, rate: number): Promise<boolean> => {
      setError(null);
      try {
        await setExchangeRate(currency, rate);
        await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Saving the exchange rate failed.");
        return false;
      }
    },
    [queryClient],
  );

  return {
    connect,
    connecting,
    sync,
    syncing,
    disconnect,
    disconnectAll,
    setRate,
    error,
    clearError: () => setError(null),
  };
}
