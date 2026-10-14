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
import { formatConversion, hourLabel } from "@/lib/conversion";
import type { TrafficNudgeSheet } from "@/types/brief";
import { formatCurrency, formatNumber, formatTime } from "@/utils/format";

interface TrafficReviewProps {
  initialSheets: TrafficNudgeSheet[];
}

function formatSentAt(iso: string): string {
  return formatTime(iso); // store (NY) time — SPEC-129
}

function gapPts(sheet: TrafficNudgeSheet): string {
  return `${Math.round(sheet.gap_pts * 100)} pts`;
}

/** Pure display + navigation (SPEC-114) — every send happens on the shared
 * compose page reached via `Link`; this never sends anything itself. Sent
 * status comes straight from `initialSheets`, refreshed by the server on each
 * navigation back. Mirrors OverdueReview. */
export function TrafficReview({ initialSheets }: TrafficReviewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    (initialSheets.find((s) => !s.sent) ?? initialSheets[0])?.location_id ?? null,
  );

  const selected =
    initialSheets.find((s) => s.location_id === selectedId) ?? initialSheets[0] ?? null;
  const sentCount = initialSheets.filter((s) => s.sent).length;

  if (initialSheets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No under-performing stores right now — every store is converting in line with your
          best. Check back after the next footfall sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {sentCount} of {initialSheets.length}
        </span>{" "}
        store{initialSheets.length === 1 ? "" : "s"} nudged today
      </p>

      <div className="grid gap-4 md:h-[70vh] md:min-h-[480px] md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="scrollbar-subtle space-y-1.5 md:overflow-y-auto md:pr-1">
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
                <span className="text-sm font-semibold">{sheet.location}</span>
                <Badge variant={sheet.sent ? "secondary" : "outline"} className="shrink-0">
                  {sheet.sent && sheet.sent_at ? `✓ Sent ${formatSentAt(sheet.sent_at)}` : "Pending"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ~{formatCurrency(sheet.opportunity)} opportunity · {gapPts(sheet)} behind
              </p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex flex-col rounded-xl border border-border bg-card p-5 md:overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold">{selected.location}</h3>
                <p className="text-xs text-muted-foreground">
                  ~{formatCurrency(selected.opportunity)} in walk-ins not converting
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.sent ? (
                  <Badge variant="secondary">
                    {selected.sent_at ? `✓ Sent ${formatSentAt(selected.sent_at)}` : "✓ Sent"}
                  </Badge>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/brief/traffic/send/${selected.location_id}`}>
                    {selected.sent ? "View" : "Send this nudge"}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="scrollbar-subtle mt-4 flex-1 space-y-4 md:overflow-y-auto">
              {/* Conversion vs benchmark */}
              <div className="grid grid-cols-3 gap-3">
                <Stat label="This store" value={formatConversion(selected.conversion_rate)} />
                <Stat
                  label={selected.benchmark_store}
                  value={formatConversion(selected.benchmark_rate)}
                  hint="best store"
                />
                <Stat label="Gap" value={gapPts(selected)} tone="warning" />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(selected.visitors)} in-store visitors ·{" "}
                {formatNumber(selected.transactions)} sales
                {selected.avg_order_value
                  ? ` · ${formatCurrency(selected.avg_order_value)} AOV`
                  : ""}{" "}
                over the last 7 days.
              </p>

              {/* Busy hours */}
              {selected.busy_hours.length > 0 ? (
                <div>
                  <p className="mb-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                    Staff these hours
                  </p>
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Hour</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Converting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.busy_hours.map((h) => (
                        <TableRow key={h.hour}>
                          <TableCell className="font-medium">{hourLabel(h.hour)}</TableCell>
                          <TableCell className="text-right">{formatNumber(h.visitors)}</TableCell>
                          <TableCell className="text-right">
                            {formatConversion(h.conversion_rate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Busy hours converting below this store&apos;s own average — the classic
                    understaffed-floor signal.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No single hour stands out — the gap is spread across the day.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="truncate text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-lg font-semibold ${tone === "warning" ? "text-warning" : ""}`}>
        {value}
      </p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
