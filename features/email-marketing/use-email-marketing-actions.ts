"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { EMAIL_MARKETING_KEY } from "@/lib/queries/email-marketing";

/**
 * Runs one Email Marketing Manager write (SPEC-345) and refreshes every read of the
 * domain after it, so each view shows the source of truth rather than a guess. `busy`
 * names the write in flight, so only its own button spins; a failure leaves everything as
 * it was and says why. One write at a time (SPEC-347): a second click or key press while
 * one is in flight is ignored — a ref, because `busy` only updates after a render.
 */
export function useEmailMarketingActions() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(
    async <T,>(key: string, write: () => Promise<T>): Promise<T | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setBusy(key);
      setError(null);
      try {
        const result = await write();
        await queryClient.invalidateQueries({ queryKey: EMAIL_MARKETING_KEY });
        return result;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That did not go through. Nothing was changed.");
        return null;
      } finally {
        inFlight.current = false;
        setBusy(null);
      }
    },
    [queryClient],
  );

  return { busy, error, run, clearError: () => setError(null) };
}
