"use client";

import Link from "next/link";
import { Download } from "lucide-react";

import CustomersLoading from "@/app/(app)/customers/loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DueToReorderTable } from "@/features/customers/due-to-reorder-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import type { CustomersFilters } from "@/lib/customers-filters";
import { customerQueries } from "@/lib/queries/customers";
import { integrationQueries } from "@/lib/queries/integrations";
import { CUSTOMERS_PAGE_SIZE } from "@/lib/page-sizes";
import { winbackCardCta } from "@/lib/winback-sync";
import { formatCurrency } from "@/utils/format";

function exportHref(segment: string): string {
  return `/api/proxy/customers/money-finder/${segment}/export`;
}

/** The Money Finder, read from the client cache (SPEC-230). */
export function CustomersView({ filters }: { filters: CustomersFilters }) {
  const finder = useApiQuery(
    customerQueries.moneyFinder({ page: filters.page, limit: CUSTOMERS_PAGE_SIZE, q: filters.q }),
  );
  // SPEC-356 patch: the card says when Klaviyo isn't connected. The overview is cached app-wide;
  // a role that cannot see integrations leaves it unknown, and the card stays as it was.
  const can = useCan();
  const overview = useApiQuery(integrationQueries.overview(), {
    enabled: can("integrations.view").allowed,
  });
  const cta = winbackCardCta(overview.data?.integrations.find((i) => i.key === "klaviyo")?.connected);

  if (finder.isPending) return <CustomersLoading />;
  if (finder.isError) {
    const err = finder.error;
    const message =
      err instanceof ApiError
        ? `Could not load the Money Finder (${err.status}) — try refreshing.`
        : "Could not load the Money Finder — check your connection and try again.";
    return (
      <div>
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  const data = finder.data;
  const due = data.due_to_reorder;
  const cat = data.category_lovers;
  const sale = data.sale_only_shoppers;

  return (
    <div className="space-y-6">
      {/* Hero strip — deduplicated across every segment, computed server-side */}
      <Card className="grid grid-cols-1 divide-y divide-success/20 bg-success/5 p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5 text-left">
          <p className="text-3xl font-semibold tabular-nums">{data.hero.total_customers}</p>
          <p className="mt-1 text-xs text-muted-foreground">customers flagged, across every segment</p>
        </div>
        <div className="p-5 text-left">
          <p className="text-3xl font-semibold tabular-nums">{formatCurrency(data.hero.total_value)}</p>
          <p className="mt-1 text-xs text-muted-foreground">their combined lifetime value</p>
        </div>
        <div className="p-5 text-left">
          <p className="text-3xl font-semibold tabular-nums">{data.hero.segment_count}</p>
          <p className="mt-1 text-xs text-muted-foreground">segments with real signal right now</p>
        </div>
      </Card>

      {/* Segment cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Drifting VIPs
          </p>
          <p className="mt-2 text-2xl font-semibold">{data.vip_summary.count}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.vip_summary.total_value)} lifetime value going quiet
          </p>
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers/winback">{cta.label}</Link>
            </Button>
            {cta.hint ? (
              <Link
                href={cta.hint.href}
                className="rounded-sm text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {cta.hint.text}
              </Link>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Category lovers
          </p>
          {cat ? (
            <>
              <p className="mt-2 text-2xl font-semibold">{cat.category}</p>
              <p className="text-sm text-muted-foreground">
                {cat.count} customers · {formatCurrency(cat.total_value)} · avg {cat.avg_orders}{" "}
                orders · silent {cat.min_days_silent}–{cat.max_days_silent}d
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={exportHref("category_lovers")} download>
                    <Download className="size-4" aria-hidden />
                    Export CSV
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Not enough signal yet for this segment.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sale-only shoppers
          </p>
          {sale ? (
            <>
              <p className="mt-2 text-2xl font-semibold">{sale.count}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(sale.total_value)} · buy only on discount — a sale wakes them
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={exportHref("sale_only_shoppers")} download>
                    <Download className="size-4" aria-hidden />
                    Export CSV
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Not enough signal yet for this segment.
            </p>
          )}
        </Card>
      </div>

      {/* Due to reorder */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-sm font-semibold">Due to reorder</h2>
          <p className="text-xs text-muted-foreground">
            Past their own usual buying gap — not dormant yet, just about to drift.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref("due_to_reorder")} download>
              <Download className="size-4" aria-hidden />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <DueToReorderTable initialData={due} initialQuery={filters.q} pageSize={CUSTOMERS_PAGE_SIZE} />
    </div>
  );
}
