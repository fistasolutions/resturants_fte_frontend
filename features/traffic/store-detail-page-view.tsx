"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StoreDetailView } from "@/features/traffic/store-detail-view";
import { TrafficError } from "@/features/traffic/traffic-error";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { trafficQueries } from "@/lib/queries/traffic";

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/traffic/stores" className="transition-colors hover:text-foreground">
        Store League
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="font-medium text-foreground">{name}</span>
    </nav>
  );
}

/** One store's footfall & conversion, read from the client cache (SPEC-230). */
export function StoreDetailPageView({ locationId, range }: { locationId: number; range: ResolvedRange }) {
  const detail = useApiQuery(trafficQueries.storeDetail(locationId, range.from, range.to));

  if (detail.isPending) {
    return (
      <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
        <Breadcrumb name="Store" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </main>
    );
  }
  if (detail.isError) return <TrafficError />;

  const data = detail.data;
  if (!data.found) {
    return (
      <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
        <Breadcrumb name="Store" />
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            That store wasn&apos;t found. It may not be one of your V-Count locations.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
      <div className="space-y-3">
        <Breadcrumb name={data.location} />
        <div>
          <h1 className="font-heading text-2xl tracking-wide">{data.location}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            In-store footfall &amp; conversion for this store. Footfall lands about a day
            after; sales are near-real-time.
          </p>
        </div>
      </div>
      <StoreDetailView data={data} />
    </main>
  );
}
