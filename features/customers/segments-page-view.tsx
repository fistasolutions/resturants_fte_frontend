"use client";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SegmentsView } from "@/features/customers/segments-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { customerQueries } from "@/lib/queries/customers";

/** Segments, read from the client cache (SPEC-230). */
export function SegmentsPageView() {
  const query = useApiQuery(customerQueries.segments());

  if (query.isPending) {
    // SPEC-232: the shell already painted the header — skeleton the content only.
    return <PageSkeleton blocks={3} />;
  }
  if (query.isError) {
    return (
      <div>
        <p className="text-sm text-destructive">Couldn&apos;t load customer segments — try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SegmentsView data={query.data} />
    </div>
  );
}
