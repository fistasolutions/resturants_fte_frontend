"use client";

import { useSearchParams } from "next/navigation";

import { StoreSwitcher } from "@/components/layout/store-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ComparePicker } from "@/features/dashboard/compare-picker";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { resolveDateRange } from "@/lib/date-range";
import { storeQueries } from "@/lib/queries/store";
import { LIVE_QUERY_OPTIONS } from "@/lib/query-client";

/**
 * Persistent Dashboard shell (SPEC-232). The greeting is time-of-day and comes from
 * the layout; the range comes from the URL — so the header paints instantly. The
 * owner's name and the store switcher read the same cached queries the view reads
 * (no extra request) and fill in the moment they land, never gating the header.
 * Before this, the whole header lived inside the data view behind three queries.
 */
export function DashboardShell({
  greeting,
  children,
}: {
  greeting: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const range = resolveDateRange(
    Object.fromEntries(searchParams.entries()),
    new Date().toISOString().slice(0, 10),
  );
  const user = useApiQuery(storeQueries.currentUser());
  const store = useApiQuery(storeQueries.connection(), LIVE_QUERY_OPTIONS);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl tracking-wide md:text-3xl">
              {greeting}
              {user.data ? `, ${user.data.name}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {store.data ? (
              <StoreSwitcher store={store.data} />
            ) : (
              <Skeleton className="h-9 w-32 rounded-lg" />
            )}
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath="/dashboard"
            />
            <ComparePicker />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
