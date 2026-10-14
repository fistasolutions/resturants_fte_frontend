"use client";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RepeatClockView } from "@/features/customers/repeat-clock-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { customerQueries } from "@/lib/queries/customers";

/** Repeat Clock, read from the client cache (SPEC-230). */
export function RepeatClockPageView() {
  const query = useApiQuery(customerQueries.repeatClock());

  if (query.isPending) {
    // SPEC-232: the shell already painted the header — skeleton the content only.
    return <PageSkeleton blocks={3} />;
  }
  if (query.isError) {
    return (
      <div>
        <p className="text-sm text-destructive">Couldn&apos;t load the repeat clock — try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RepeatClockView data={query.data} />
    </div>
  );
}
