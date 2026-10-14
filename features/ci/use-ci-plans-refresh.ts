"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CI_PLANS_KEY } from "@/lib/queries/ci-plans";

/** After any plan write (SPEC-272): invalidate the `["ci-plans"]` family so the list
 * and the open plan agree without a reload. */
export function useCiPlansRefresh(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CI_PLANS_KEY });
  }, [queryClient]);
}
