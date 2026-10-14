"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, ChevronRight, Gauge, PackageCheck, RotateCcw, Timer } from "lucide-react";

import WarehouseLoading from "@/app/(app)/warehouse/loading";
import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BacklogAttentionCard } from "@/features/warehouse/backlog-attention";
import { BacklogPanel } from "@/features/warehouse/backlog-panel";
import { HourlyStrip } from "@/features/warehouse/hourly-strip";
import { LiveSyncStatus } from "@/features/warehouse/live-sync-status";
import type { ResolvedRange } from "@/lib/date-range";
import { IpackyUpload } from "@/features/warehouse/ipacky-upload";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDuration } from "@/lib/format-duration";
import { warehouseQueries } from "@/lib/queries/warehouse";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/utils/format";

function perHour(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

/** Warehouse overview (backend SPEC-097), read from the client cache (SPEC-230). */
export function WarehouseView({ range, live }: { range: ResolvedRange; live: boolean }) {
  const overview = useApiQuery(warehouseQueries.overview(range.from, range.to));
  if (overview.isPending) return <WarehouseLoading />;
  const failed = overview.isError;
  const data = overview.data ?? null;

  const backlog = data?.backlog;

  return (
    <div className="space-y-6">
      {failed ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
          We couldn&apos;t load warehouse data right now. Try again shortly.
        </div>
      ) : (
        <>
          {/* Backlog — always from live Shopify, even before any iPacky import */}
          {backlog && <BacklogPanel backlog={backlog} />}

          {/* Supervision (SPEC-147): flag an aging backlog + email the warehouse manager */}
          {backlog?.attention && <BacklogAttentionCard attention={backlog.attention} />}

          {/* Per-packer productivity — from iPacky */}
          {data?.has_data ? (
            <>
              <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Stat label="Orders packed" value={formatNumber(data.totals.orders_packed)} icon={PackageCheck} />
                <Stat label="Items packed" value={formatNumber(data.totals.items_packed)} icon={Boxes} />
                <Stat
                  label="Avg ready → packed"
                  value={data.totals.avg_lead_seconds ? formatDuration(data.totals.avg_lead_seconds) : "—"}
                  icon={Timer}
                />
                <Stat
                  label="Avg pack time"
                  value={data.totals.avg_pack_seconds ? formatDuration(data.totals.avg_pack_seconds) : "—"}
                  icon={Gauge}
                />
                <Stat label="Deviations" value={formatNumber(data.totals.deviations)} icon={AlertTriangle} />
                <Stat label="Repacks" value={formatNumber(data.totals.repacks)} icon={RotateCcw} />
              </section>

              <HourlyStrip hourly={data.hourly} />

              <div className="overflow-x-auto rounded-card border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Packer</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Orders/hr</TableHead>
                      <TableHead className="text-right">Items/hr</TableHead>
                      <TableHead className="text-right">Avg pack time</TableHead>
                      <TableHead className="text-right">Lead time</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead className="text-right">Deviations</TableHead>
                      <TableHead className="text-right">Dev. rate</TableHead>
                      <TableHead className="text-right">Repacks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.packers.map((p) => (
                      <TableRow key={p.packer_name}>
                        <TableCell className="font-medium text-foreground">
                          <Link
                            href={`/warehouse/packer/${encodeURIComponent(p.packer_name)}?start=${range.from}&end=${range.to}`}
                            className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                          >
                            {p.packer_name}
                            <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(p.orders_packed)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(p.items_packed)}</TableCell>
                        <TableCell className="text-right tabular-nums">{perHour(p.orders_per_hour)}</TableCell>
                        <TableCell className="text-right tabular-nums">{perHour(p.items_per_hour)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {p.avg_packing_seconds ? formatDuration(p.avg_packing_seconds) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {p.avg_lead_seconds ? formatDuration(p.avg_lead_seconds) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {p.utilization != null ? formatPercent(p.utilization * 100) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(p.deviations)}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            p.deviation_rate != null && p.deviation_rate >= 0.1
                              ? "text-warning"
                              : "text-muted-foreground",
                          )}
                        >
                          {p.deviation_rate != null ? formatPercent(p.deviation_rate * 100) : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            p.repacks > 0 ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {formatNumber(p.repacks)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageCheck className="size-5" aria-hidden />
              </span>
              <h2 className="font-heading text-lg tracking-wide">No packing data for this period yet</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Import an iPacky Order Check Report (the nightly export) to see per-packer productivity,
                throughput, and repacks. The backlog above is live from Shopify.
              </p>
              <div className="mt-4">
                <IpackyUpload />
              </div>
            </div>
          )}

          <LiveSyncStatus lastSync={data?.last_sync ?? null} live={live} />
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className="flex items-center gap-1">
          <ExplainButton placement="inline" target={{ metric: label, value }} />
          <Icon className="size-4 text-muted-foreground" />
        </span>
      </div>
      <p className="font-heading text-xl tabular-nums md:text-2xl">{value}</p>
    </Card>
  );
}
