"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LocationTransferOpportunity } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const PAGE_SIZE = 10;

interface LocationTransferReviewProps {
  locationId: number;
  opportunities: LocationTransferOpportunity[];
}

function opportunityHref(locationId: number, opportunity: LocationTransferOpportunity): string {
  return `/inventory/store-transfers/${locationId}/${opportunity.product_id}`;
}

function formatIdle(days: number | null): string {
  if (days === null) return "never sold here";
  if (days === 0) return "sold today";
  return `${formatNumber(days)}d idle`;
}

function SizesCell({ opportunity }: { opportunity: LocationTransferOpportunity }) {
  const sizes = opportunity.size_breakdown;
  if (sizes.length === 0) return <span className="text-muted-foreground">—</span>;
  const shown = sizes.slice(0, 3);
  const hidden = sizes.slice(3);
  const remainingUnits = hidden.reduce((sum, s) => sum + s.units, 0);
  return (
    <div className="flex max-w-48 flex-wrap items-center gap-1">
      {shown.map((size, i) => (
        <Badge
          key={`${size.sku ?? size.variant_title}-${i}`}
          variant="outline"
          className="font-normal"
        >
          {size.variant_title} · {formatNumber(size.units)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          +{formatNumber(hidden.length)} ({formatNumber(remainingUnits)})
        </span>
      )}
    </div>
  );
}

/** Ranked table of transfer-in candidates for one destination location
 * (SPEC-081) — same dense-table pattern as `DeadInventoryReview`, this
 * feature's mirror-image sibling (source vs. destination framing). */
export function LocationTransferReview({
  locationId,
  opportunities,
}: LocationTransferReviewProps) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(opportunities.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = useMemo(
    () => opportunities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [opportunities, currentPage],
  );

  if (opportunities.length === 0) {
    return (
      <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
        <p className="text-sm font-medium text-foreground">Nothing to transfer in right now.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No other store is sitting on stock this location is actively selling.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="max-h-[70vh] overflow-auto scrollbar-subtle">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 w-8 pl-4 pr-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Style
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Source · idle
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Available
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Value
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Your demand
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Your stock
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Sizes at source
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((opportunity, i) => {
              const rank = (currentPage - 1) * PAGE_SIZE + i + 1;
              return (
                <TableRow
                  key={`${opportunity.product_id}-${opportunity.source_location_id}`}
                  className="group relative align-top"
                >
                  <TableCell className="py-2 pl-4 pr-1 text-xs tabular-nums text-muted-foreground">
                    {String(rank).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="max-w-56 py-2 px-2">
                    <Link
                      href={opportunityHref(locationId, opportunity)}
                      className="block truncate text-sm font-semibold leading-tight text-foreground outline-none transition-colors after:absolute after:inset-0 after:content-[''] hover:text-foreground/80 focus-visible:underline"
                      aria-label={`Open ${opportunity.title}`}
                    >
                      {opportunity.title}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {opportunity.source_location_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatIdle(opportunity.days_since_last_sale_at_source)}
                    </p>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums">
                    {formatNumber(opportunity.source_stock)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm font-semibold tabular-nums text-warning">
                    {formatCurrency(opportunity.source_stock_value)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums text-success">
                    {formatNumber(opportunity.destination_units_sold)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums">
                    {formatNumber(opportunity.destination_stock)}
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <SizesCell opportunity={opportunity} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatNumber(opportunities.length)}
          </span>{" "}
          style{opportunities.length === 1 ? "" : "s"} available to transfer in
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden />
            Prev
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Next page"
          >
            Next
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
