"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CUSTOMER_SUPPORT_KEY } from "@/lib/queries/customer-support";
import type { ActionResult } from "@/services/customer-support-actions";

/**
 * Runs one Customer Support Agent write (SPEC-346) and refreshes every read of the domain
 * after it, so each view shows the store of truth rather than a guess. `busy` names the write
 * in flight, so only its own button spins; a failure leaves everything as it was and says why;
 * a success says what happened. One write at a time (SPEC-347): a second click or key press
 * while one is in flight is ignored — a ref, because `busy` only updates after a render.
 */
export function useSupportActions() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const handle = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(handle);
  }, [notice]);

  const run = useCallback(
    async (key: string, write: () => Promise<ActionResult>): Promise<boolean> => {
      if (inFlight.current) return false;
      inFlight.current = true;
      setBusy(key);
      setError(null);
      try {
        const result = await write();
        setNotice(result.message);
        await queryClient.invalidateQueries({ queryKey: CUSTOMER_SUPPORT_KEY });
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That did not go through. Nothing was changed.");
        return false;
      } finally {
        inFlight.current = false;
        setBusy(null);
      }
    },
    [queryClient],
  );

  return { busy, error, notice, run, clearError: () => setError(null), clearNotice: () => setNotice(null) };
}

export type SupportActions = ReturnType<typeof useSupportActions>;
