"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ReturnsHubLink } from "@/components/shared/returns-hub-link";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { returnsSpikeHref } from "@/lib/order-filters";
import { dashboardQueries } from "@/lib/queries/dashboard";

/** Subpage for the dashboard's Returns Spike card (SPEC-070), read from the client
 * cache (SPEC-230). The loader resolves null on failure — the retry card, as before. */
export function ReturnsSpikeView() {
  const top = useApiQuery(dashboardQueries.returnsSpikeTop());
  const items = top.data;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/orders" className="transition-colors hover:text-foreground">
            Orders
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="font-medium text-foreground">Returns Spike</span>
        </nav>

        <div>
          <h1 className="font-heading text-2xl tracking-wide">Returns Spike</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Top styles by return rate, last 30 days, ranked worst-first.
          </p>
        </div>
      </div>

      {/* SPEC-154 — this spike view is one returns slice; link to the full hub. */}
      <ReturnsHubLink />

      {top.isPending ? (
        <Skeleton className="h-72 rounded-card" />
      ) : items === null || items === undefined ? (
        <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium text-destructive">
            Could not load top styles — try refreshing.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            No return spikes in the last 30 days.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border rounded-card bg-card ring-1 ring-foreground/10">
          {items.map((item, index) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium">{item.product}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-destructive">
                  {item.ratePct}%
                </span>
                <Link
                  href={
                    item.orderId !== null
                      ? `/orders/${item.orderId}`
                      : returnsSpikeHref(item.productId, item.product)
                  }
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {item.orderId !== null ? "Order details" : "Orders"}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
