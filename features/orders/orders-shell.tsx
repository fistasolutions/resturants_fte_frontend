"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, Download, Search, Send } from "lucide-react";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { FiltersBar } from "@/features/orders/filters-bar";
import { OrdersTabs } from "@/features/orders/orders-tabs";
import { formatRangeLabel } from "@/lib/date-range";
import {
  filterSummary,
  locationLabel,
  ordersApiQuery,
  parseOrderFilters,
} from "@/lib/order-filters";
import { activeOrdersTab, type OrdersTab } from "@/lib/order-tabs";

/** Tab-contextual bridge to the analytics page for that transaction type
 * (SPEC-101): the tab lists the orders, the linked page interprets them. Only
 * the Returns and Discounted tabs have a meaningful destination. */
const TAB_BRIDGE: Partial<Record<OrdersTab, { href: string; label: string }>> = {
  returns: { href: "/returns", label: "Returns Intelligence" },
  discounted: { href: "/discounts", label: "Discount Monitoring" },
};

/**
 * Persistent Orders shell (SPEC-087). Rendered from the orders `layout.tsx`, so
 * it stays mounted across tab switches: the header, tab bar, and filters row
 * never re-render as part of a content swap — only `{children}` (the active
 * tab's table) changes, showing its own content-only skeleton while it loads.
 *
 * On any non-tab route under `/orders` (an order detail, the Send-to-manager
 * review flow, returns-spike) it renders `{children}` bare — those pages own
 * their own header and `<main>`.
 */
export function OrdersShell({
  locations,
  children,
}: {
  locations: { id: number; name: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeOrdersTab(pathname);

  if (!active) return <>{children}</>;

  const filters = parseOrderFilters(Object.fromEntries(searchParams.entries()));
  const activeLocationName = locationLabel(filters, locations);
  const summary = filterSummary({
    ...filters,
    locationName: activeLocationName ?? filters.locationName,
  });

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Orders"
        description={summary}
        actions={
          <div className="flex items-center gap-2">
            {active === "all" && (
              <Button variant="default" size="sm" asChild>
                <Link href={`/orders/review?${ordersApiQuery(filters)}`}>
                  <Send className="size-4" aria-hidden />
                  Send to manager
                </Link>
              </Button>
            )}
            {TAB_BRIDGE[active] && (
              <Button variant="outline" size="sm" asChild>
                <Link href={TAB_BRIDGE[active]!.href}>
                  {TAB_BRIDGE[active]!.label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/proxy/orders/export?${ordersApiQuery(filters)}`} download>
                <Download className="size-4" aria-hidden />
                Export CSV
              </a>
            </Button>
          </div>
        }
      />

      <div>
        <OrdersTabs />
        <FolderPanel>
          <div className="flex flex-wrap items-center gap-3">
            <form method="get" action={pathname} role="search" className="relative w-full max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Search order number…"
                aria-label="Search orders by number"
                className="pl-9"
              />
              {filters.fulfillment && (
                <input type="hidden" name="fulfillment" value={filters.fulfillment} />
              )}
              {filters.location && <input type="hidden" name="location" value={filters.location} />}
              {filters.locationName && (
                <input type="hidden" name="loc_name" value={filters.locationName} />
              )}
              {filters.age && <input type="hidden" name="age" value={filters.age} />}
              {filters.from && filters.to && (
                <>
                  <input type="hidden" name="from" value={filters.from} />
                  <input type="hidden" name="to" value={filters.to} />
                </>
              )}
            </form>

            {/* Placed-date range (SPEC-040): same Shopify-style picker as the
                dashboard; "All time" is the default. Merges into the current URL,
                so the other filters survive a range change. */}
            <DateRangePicker
              from={filters.from}
              to={filters.to}
              preset={null}
              label={filters.from && filters.to ? formatRangeLabel(filters.from, filters.to) : "All time"}
              basePath={pathname}
              allowAllTime
            />
            <FiltersBar filters={filters} locations={locations} basePath={pathname} />
          </div>

          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
