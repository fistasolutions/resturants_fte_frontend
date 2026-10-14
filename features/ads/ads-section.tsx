"use client";

import { AdsShell } from "@/features/ads/ads-shell";
import { useApiQuery } from "@/hooks/use-api-query";
import { adsQueries } from "@/lib/queries/ads";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Performance Ads shell fed from the client cache (SPEC-230). The ads layout
 * prefetches the budget summary once for the whole section; the strip shows a
 * skeleton until it lands and the cached answer thereafter. The shell also owns the
 * kill-switch state, as before.
 */
export function AdsSection({ children }: { children: React.ReactNode }) {
  const budget = useApiQuery(adsQueries.budget());
  if (budget.isPending || budget.isError) {
    return (
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-9 w-80 max-w-full rounded-lg" />
        {children}
      </main>
    );
  }
  return <AdsShell budget={budget.data}>{children}</AdsShell>;
}
