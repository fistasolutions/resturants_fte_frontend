"use client";

import { useState } from "react";
import Link from "next/link";

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
import type { TransferSheet } from "@/types/brief";
import { formatCurrency, formatTime } from "@/utils/format";

interface TransferReviewProps {
  initialSheets: TransferSheet[];
}

function formatSentAt(iso: string): string {
  return formatTime(iso); // store (NY) time — SPEC-129
}

/** Pure display + navigation (SPEC-066) — every send action (single
 * location or bulk) happens on its own compose page, reached via `Link`;
 * this component never sends anything itself. Sent status comes straight
 * from `initialSheets`, refreshed by the server on each navigation back. */
export function TransferReview({ initialSheets }: TransferReviewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    (initialSheets.find((s) => !s.sent) ?? initialSheets[0])?.location_id ?? null,
  );

  const selected =
    initialSheets.find((s) => s.location_id === selectedId) ?? initialSheets[0] ?? null;
  const remaining = initialSheets.filter((s) => !s.sent);
  const sentCount = initialSheets.length - remaining.length;

  if (initialSheets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No transfer opportunities right now — check back after the next sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {sentCount} of {initialSheets.length}
          </span>{" "}
          location{initialSheets.length === 1 ? "" : "s"} sent
          {remaining.length > 0 ? ` · ${remaining.length} remaining` : " — all done today."}
        </p>
        {remaining.length === 0 ? (
          <Button disabled>Send All Remaining</Button>
        ) : (
          <Button asChild>
            <Link href="/inventory/transfers/review/send-all">Send All Remaining</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:h-[70vh] md:min-h-[480px] md:grid-cols-[280px_1fr]">
        {/* Sidebar — stays put; only the detail panel scrolls */}
        <div className="space-y-1.5 md:overflow-y-auto md:pr-1 scrollbar-subtle">
          {initialSheets.map((sheet) => (
            <button
              key={sheet.location_id}
              onClick={() => setSelectedId(sheet.location_id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                sheet.location_id === selectedId
                  ? "border-foreground/40 bg-muted/60"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{sheet.location_name}</span>
                <Badge variant={sheet.sent ? "secondary" : "outline"} className="shrink-0">
                  {sheet.sent && sheet.sent_at ? `✓ Sent ${formatSentAt(sheet.sent_at)}` : "Pending"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatCurrency(sheet.total_value)} recoverable
              </p>
            </button>
          ))}
        </div>

        {/* Detail panel — fixed height; only the table body scrolls */}
        {selected && (
          <div className="flex flex-col rounded-xl border border-border bg-card p-5 md:overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold">{selected.location_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(selected.total_value)} recoverable once transferred
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.sent ? (
                  <Badge variant="secondary">
                    {selected.sent_at ? `✓ Sent ${formatSentAt(selected.sent_at)}` : "✓ Sent"}
                  </Badge>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/inventory/transfers/review/send/${selected.location_id}`}>
                    {selected.sent ? "View" : "Send this sheet"}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex-1 md:overflow-y-auto scrollbar-subtle">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Velocity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.units}</TableCell>
                      <TableCell className="text-muted-foreground">{item.from_location}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.weekly_velocity.toFixed(0)}/week
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
