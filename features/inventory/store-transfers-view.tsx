"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { LocationTransferReview } from "@/features/inventory/location-transfer-review";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { analysisQueries } from "@/lib/queries/analysis";
import { formatNumber } from "@/utils/format";

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 basis-36 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}


function TransferError({ message }: { message: string }) {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">Store Transfers</span>
      </nav>
      <p className="py-12 text-center text-sm text-destructive">{message}</p>
    </main>
  );
}

function TransferSkeleton() {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-16 rounded-card" />
      <Skeleton className="h-96 rounded-card" />
    </main>
  );
}

/** Per-store transfer-in opportunities (SPEC-081; backend SPEC-075), read from the
 * client cache (SPEC-230). A 404 (unknown location) keeps its own copy. */
export function StoreTransfersView({ locationId }: { locationId: number }) {
  const result = useApiQuery(analysisQueries.locationTransfers(locationId));
  if (result.isPending) return <TransferSkeleton />;
  if (result.isError) {
    const err = result.error;
    const message =
      err instanceof ApiError && err.status === 404
        ? "This location doesn't exist or has been removed."
        : err instanceof ApiError
          ? `Could not load transfer opportunities (${err.status}) — try refreshing.`
          : "Could not load transfer opportunities — check your connection and try again.";
    return <TransferError message={message} />;
  }
  const data = result.data;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/inventory" className="transition-colors hover:text-foreground">
            Inventory Analyst
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="font-medium text-foreground">{data.location_name} Transfers</span>
        </nav>

        <div>
          <h1 className="font-heading text-2xl tracking-wide">
            {data.location_name} Transfers
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Styles {data.location_name} is actively selling but low or out of, sitting
            unsold at another store — ranked by {data.location_name}&apos;s own demand.
            Warehouse stock is excluded; this is store-to-store only.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap divide-y divide-border rounded-card bg-card ring-1 ring-foreground/10 sm:divide-x sm:divide-y-0">
        <SummaryStat
          label="Styles available"
          value={formatNumber(data.summary.styles_available)}
        />
        <SummaryStat
          label="Units available"
          value={formatNumber(data.summary.total_units_available)}
        />
        <SummaryStat label="Window" value={`${data.window_days}d`} />
      </div>

      <LocationTransferReview locationId={data.location_id} opportunities={data.opportunities} />
    </main>
  );
}
