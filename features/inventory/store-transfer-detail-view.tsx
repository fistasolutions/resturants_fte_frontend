"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { LocationTransferDetail } from "@/features/inventory/location-transfer-detail";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { analysisQueries } from "@/lib/queries/analysis";

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

/** One transfer-in candidate (SPEC-081) — selected from the same cached list answer
 * the store page holds (root Rule 8, view selection only; SPEC-230). */
export function StoreTransferDetailView({ locationId, productId }: { locationId: number; productId: string }) {
  const result = useApiQuery(analysisQueries.locationTransfers(locationId));
  if (result.isPending) return <TransferSkeleton />;
  if (result.isError) {
    const err = result.error;
    const message =
      err instanceof ApiError && err.status === 404
        ? "This location doesn't exist or has been removed."
        : "Could not load this opportunity — check your connection and try again.";
    return <TransferError message={message} />;
  }
  const data = result.data;
  const opportunity =
    data.opportunities.find((o) => o.product_id === Number(productId)) ?? null;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <Link
          href={`/inventory/store-transfers/${data.location_id}`}
          className="transition-colors hover:text-foreground"
        >
          {data.location_name} Transfers
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="max-w-full truncate font-medium text-foreground">
          {opportunity ? opportunity.title : "Opportunity detail"}
        </span>
      </nav>

      {opportunity === null ? (
        <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium text-foreground">
            This opportunity is no longer available.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            It either resolved between the list load and now, or the link is stale.
            Head back to the live list for the current window.
          </p>
          <Link
            href={`/inventory/store-transfers/${data.location_id}`}
            className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4"
          >
            Back to {data.location_name} Transfers
          </Link>
        </div>
      ) : (
        <LocationTransferDetail
          opportunity={opportunity}
          destinationLocationName={data.location_name}
          windowDays={data.window_days}
        />
      )}
    </main>
  );
}
