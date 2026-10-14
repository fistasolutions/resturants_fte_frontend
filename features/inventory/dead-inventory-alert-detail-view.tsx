"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import MisplacedLoading from "@/app/(app)/inventory/dead-inventory-alerts/loading";
import { DeadInventoryDetail } from "@/features/inventory/dead-inventory-detail";
import { useApiQuery } from "@/hooks/use-api-query";
import { analysisQueries } from "@/lib/queries/analysis";

/** One flagged (style, location) pair — SPEC-064 — selected from the same cached
 * alerts answer the list page put in the client cache (SPEC-230). */
export function DeadInventoryAlertDetailView({ productId, locationId }: { productId: string; locationId: string }) {
  const alerts = useApiQuery(analysisQueries.deadInventoryAlerts());
  if (alerts.isPending) return <MisplacedLoading />;
  const data = alerts.data ?? null;
  const alert =
    data?.alerts.find(
      (a) =>
        a.product_id === Number(productId) && a.location_id === Number(locationId),
    ) ?? null;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      {/* Breadcrumb — same 3-level pattern as the parent review page, plus this alert. */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <Link
          href="/inventory/dead-inventory-alerts"
          className="transition-colors hover:text-foreground"
        >
          Misplaced stock
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="max-w-full truncate font-medium text-foreground">
          {alert ? (
            <>
              {alert.title}
              <span className="mx-1 text-muted-foreground">·</span>
              {alert.location_name}
            </>
          ) : (
            "Alert detail"
          )}
        </span>
      </nav>

      {alert === null ? (
        <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium text-foreground">
            This alert is no longer flagged.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            It either resolved between the list load and now, or the link is stale.
            Head back to the live list for the current window.
          </p>
          <Link
            href="/inventory/dead-inventory-alerts"
            className="mt-3 inline-block text-sm font-medium text-foreground underline underline-offset-4"
          >
            Back to Misplaced stock
          </Link>
        </div>
      ) : (
        <DeadInventoryDetail alert={alert} windowDays={data?.window_days ?? 7} />
      )}
    </main>
  );
}
