"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FINANCE_KEY } from "@/lib/queries/finance";
import { dismissFinding, restoreFinding, saveValueAssumptions } from "@/services/finance-actions";

/**
 * The Value tab's three writes (SPEC-330) — clear a finding, restore it, save the
 * assumptions. Each refreshes the whole `["finance"]` cache: a cleared duplicate changes
 * the flags, the payment run and the overview, not just this tab.
 */
export function useValueActions() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, action: () => Promise<void>): Promise<boolean> => {
      setError(null);
      setPending(key);
      try {
        await action();
        await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn't save. Try again.");
        return false;
      } finally {
        setPending(null);
      }
    },
    [queryClient],
  );

  return {
    pending,
    error,
    clearError: () => setError(null),
    dismiss: (id: number, reason: string) => run(`dismiss-${id}`, () => dismissFinding(id, reason)),
    restore: (id: number) => run(`restore-${id}`, () => restoreFinding(id)),
    saveAssumptions: (values: Record<string, number>) =>
      run("assumptions", () => saveValueAssumptions(values)),
  };
}
