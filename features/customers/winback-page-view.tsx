"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { WinbackReviewTable } from "@/features/brief/winback-review-table";
import { WinbackSyncButton } from "@/features/brief/winback-sync-button";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { WINBACK_PAGE_SIZE } from "@/lib/page-sizes";
import { briefQueries } from "@/lib/queries/brief";
import type { WinbackFilters } from "@/lib/winback-filters";

function Header() {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground transition-colors">
          Customers
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Winback List</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Winback List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your best customers who&apos;ve gone quiet before syncing them to Klaviyo.
        </p>
      </div>
    </>
  );
}

/** Winback review + Klaviyo sync (SPEC-053, relocated SPEC-091), read from the client
 * cache (SPEC-230). */
export function WinbackPageView({ filters }: { filters: WinbackFilters }) {
  const list = useApiQuery(
    briefQueries.winback({
      page: filters.page,
      limit: WINBACK_PAGE_SIZE,
      q: filters.q,
      minSpend: filters.minSpend,
      minSilent: filters.minSilent,
    }),
  );

  if (list.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Header />
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (list.isError) {
    const err = list.error;
    const message =
      err instanceof ApiError
        ? `Could not load the winback list (${err.status}) — try refreshing.`
        : "Could not load the winback list — check your connection and try again.";
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  const data = list.data;
  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <Header />

      <WinbackSyncButton
        totalCandidates={data.total_candidates}
        initialSent={data.sent}
        initialSentAt={data.sent_at}
        klaviyo={data.klaviyo}
      />

      <WinbackReviewTable
        initialData={data}
        initialQuery={filters.q}
        initialMinSpend={filters.minSpend}
        initialMinSilent={filters.minSilent}
        pageSize={WINBACK_PAGE_SIZE}
      />
    </div>
  );
}
