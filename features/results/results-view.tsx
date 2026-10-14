"use client";

import ResultsLoading from "@/app/(app)/results/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ResultsTabs } from "@/features/results/results-tabs";
import { useApiQuery } from "@/hooks/use-api-query";
import { resultQueries } from "@/lib/queries/results";

/** Results (outcomes + value ledger), read from the client cache (SPEC-230). */
export function ResultsView() {
  const results = useApiQuery(resultQueries.results());
  const ledger = useApiQuery(resultQueries.ledger());
  // Managers (SPEC-241) degrades on its own: the tab shows a retry line if it fails.
  const managers = useApiQuery(resultQueries.managers());

  if (results.isPending || ledger.isPending) return <ResultsLoading />;
  if (results.isError) {
    return <QueryErrorState error={results.error} onRetry={() => void results.refetch()} />;
  }
  if (ledger.isError) {
    return <QueryErrorState error={ledger.error} onRetry={() => void ledger.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <ResultsTabs data={results.data} ledger={ledger.data} managers={managers.data ?? null} />
    </div>
  );
}
