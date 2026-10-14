import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/shared/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocationMiniChart } from "@/features/dashboard/location-mini-chart";
import {
  locationKey,
  locationReviewHref,
  locationsScroll,
  locationsSummary,
  splitLocations,
} from "@/lib/location-table";
import type { LocationKpi, LocationKpisData } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";

/** Panel-style column headers — the shadcn default is a full-size label. */
const HEAD = "h-9 px-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground";
const CELL = "px-3 py-2 text-xs";

function LocationRow({ loc }: { loc: LocationKpi }) {
  const href = locationReviewHref(loc);
  return (
    <TableRow>
      <TableCell className={cn(CELL, "max-w-44 pl-4")}>
        <Link
          href={href}
          title="Review orders"
          className="block truncate rounded text-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {loc.name}
        </Link>
        {loc.top_product ? (
          <p className="truncate text-[11px] text-muted-foreground">
            Top: {loc.top_product}
            {loc.top_product_revenue !== null ? ` · ${formatCurrency(loc.top_product_revenue)}` : ""}
          </p>
        ) : null}
      </TableCell>
      <TableCell className={cn(CELL, "w-20")}>
        <LocationMiniChart series={loc.revenue_series} compact />
      </TableCell>
      <TableCell className={cn(CELL, "text-right font-semibold tabular-nums")}>
        {formatCurrency(loc.revenue)}
      </TableCell>
      <TableCell className={cn(CELL, "text-right tabular-nums")}>
        {formatNumber(loc.orders)}
        <span className="text-muted-foreground"> · {formatCurrency(loc.aov)}</span>
      </TableCell>
      <TableCell className={cn(CELL, "text-right tabular-nums")}>
        {formatNumber(loc.new_customers)}
        <span className="text-muted-foreground"> · {formatNumber(loc.returning_customers)}</span>
      </TableCell>
      <TableCell className={cn(CELL, "pr-4 text-right")}>
        {loc.unfulfilled === 0 ? (
          <CheckCircle2 className="ml-auto size-3.5 text-success" aria-label="All fulfilled" />
        ) : (
          <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-destructive">
            {formatNumber(loc.unfulfilled)}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Location intelligence as a table (SPEC-233): one row per selling location, and the
 * quiet ones — no revenue, no orders — on a single footer line that still links each
 * to its review page. Nine cards became one panel.
 */
export function LocationTable({ data }: { data: LocationKpisData }) {
  if (data.locations.length === 0) return null;
  const { selling, quiet } = splitLocations(data.locations);

  return (
    <Panel
      title="Locations"
      count={locationsSummary(selling.length, quiet.length)}
      aside={
        <Link
          href="/foresight"
          className="rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Store League →
        </Link>
      }
    >
      {/* Four rows at natural height; more than four and the body scrolls under a
          sticky header (max-h-68 = header + four rows + the top of the fifth, so it reads as scrollable). */}
      <div className={cn(locationsScroll(selling.length) && "max-h-68 overflow-y-auto")}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead className={cn(HEAD, "pl-4")}>Location</TableHead>
            <TableHead className={HEAD}>Trend</TableHead>
            <TableHead className={cn(HEAD, "text-right")}>Revenue</TableHead>
            <TableHead className={cn(HEAD, "text-right")}>Orders · AOV</TableHead>
            <TableHead className={cn(HEAD, "text-right")}>New · Ret</TableHead>
            <TableHead className={cn(HEAD, "pr-4 text-right")}>Unfulfilled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selling.map((loc) => (
            <LocationRow key={locationKey(loc)} loc={loc} />
          ))}
        </TableBody>
      </Table>
      </div>
      {quiet.length > 0 ? (
        <p className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          No sales this period —{" "}
          {quiet.map((loc, i) => (
            <span key={locationKey(loc)}>
              {i > 0 ? " · " : ""}
              <Link
                href={locationReviewHref(loc)}
                className="rounded underline-offset-2 hover:text-foreground hover:underline"
              >
                {loc.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </Panel>
  );
}
