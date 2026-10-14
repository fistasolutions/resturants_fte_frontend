import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import type { DiscountLocation } from "@/types/discounts";

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** Per-location discount table (SPEC-098) — each physical location drills to its
 * employee manual-discount leaderboard. "Online" (no POS location) has no staff
 * to attribute, so it's shown but not clickable. */
export function LocationTable({
  locations,
  rangeQuery,
}: {
  locations: DiscountLocation[];
  rangeQuery: string;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">By location</h2>
        <span className="text-xs text-muted-foreground">click a store for its staff</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </TableHead>
              <TableHead className={HEAD}>Gross</TableHead>
              <TableHead className={HEAD}>Discount</TableHead>
              <TableHead className={HEAD}>% of gross</TableHead>
              <TableHead className={HEAD}>Discounted orders</TableHead>
              <TableHead className={HEAD}>Avg discount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => {
              const clickable = loc.location_id !== null;
              const href = clickable
                ? `/discounts/locations/${loc.location_id}${rangeQuery}`
                : null;
              return (
                <TableRow
                  key={loc.location_id ?? "online"}
                  className={clickable ? "relative cursor-pointer hover:bg-accent/50" : ""}
                >
                  <TableCell className="font-medium text-foreground">
                    {href ? (
                      <Link
                        href={href}
                        className="outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {loc.location}
                      </Link>
                    ) : (
                      // Online = web orders; no POS staff to drill into, so it's
                      // intentionally not clickable — say so, don't look broken.
                      <span className="flex flex-wrap items-center gap-2 text-muted-foreground">
                        {loc.location}
                        <span className="text-[0.6875rem] font-normal text-muted-foreground/70">
                          web orders — no in-store staff
                        </span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(loc.gross)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(loc.discount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {loc.discount_pct === null ? "—" : formatPercent(loc.discount_pct)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(loc.discounted_orders)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {loc.avg_discount === null ? "—" : formatCurrency(loc.avg_discount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
