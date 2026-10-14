"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { BRAND_BRAIN_KEY } from "@/lib/queries/brand-brain";

/**
 * After any Brand Brain write (SPEC-263): invalidate the whole `["brand-brain"]`
 * family plus the writers' brain read, so every sub-tab and Coverage agree without a
 * reload. Active queries refetch at once; the rest on their next mount.
 */
export function useBrandBrainRefresh(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: BRAND_BRAIN_KEY });
    void queryClient.invalidateQueries({ queryKey: ["spotlight", "brand-brain"] });
  }, [queryClient]);
}
