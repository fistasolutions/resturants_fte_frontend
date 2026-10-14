"use client";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { HealthTable } from "@/features/customers/health-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { customerQueries } from "@/lib/queries/customers";

/** Customer Health, read from the client cache (SPEC-230). */
export function HealthPageView() {
  const query = useApiQuery(customerQueries.health());

  if (query.isPending) {
    // SPEC-232: the shell already painted the header — skeleton the content only.
    return <PageSkeleton blocks={3} />;
  }
  if (query.isError) {
    return (
      <div>
        <p className="text-sm text-destructive">Couldn&apos;t load customer health — try refreshing.</p>
      </div>
    );
  }

  return <HealthTable data={query.data} />;
}
