import { AlertTriangle, Boxes, MapPin, PackageX, Wallet } from "lucide-react";

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
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import type { InventoryByLocationDashboard as Data } from "@/types/analysis";

function Tile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const accent =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span className="min-w-0 flex-1">{label}</span>
        <ExplainButton placement="inline" target={{ metric: label, value }} />
      </p>
      <p className={`mt-2 font-heading text-2xl tracking-wide tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** By-Location inventory dashboard (SPEC-100) — company KPI tiles + a ranked
 * per-store table with a value-share bar. Replaces the old single thin table. */
export function ByLocationDashboard({ data }: { data: Data | null }) {
  if (!data) {
    return (
      <Card className="px-6 py-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Location inventory is temporarily unavailable.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Try refreshing the page.</p>
      </Card>
    );
  }
  if (data.locations.length === 0) {
    return (
      <Card className="px-6 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No locations synced yet.</p>
      </Card>
    );
  }

  const t = data.totals;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Tile icon={Wallet} label="Stock value on hand" value={formatCurrency(t.stock_value)} />
        <Tile icon={Boxes} label="Units on hand" value={formatNumber(t.units)} />
        <Tile
          icon={PackageX}
          label="Out of stock"
          value={formatNumber(t.out_of_stock)}
          tone={t.out_of_stock > 0 ? "destructive" : "default"}
        />
        <Tile
          icon={AlertTriangle}
          label="Low stock"
          value={formatNumber(t.low_stock)}
          tone={t.low_stock > 0 ? "warning" : "default"}
        />
        <Tile icon={MapPin} label="Stocked locations" value={formatNumber(t.locations)} />
      </div>

      <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Inventory by location</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ranked by retail value on hand. Out-of-stock includes oversold variants.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Location
                </TableHead>
                <TableHead className={HEAD}>Units</TableHead>
                <TableHead className={HEAD}>Value on hand</TableHead>
                <TableHead className="w-40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Share
                </TableHead>
                <TableHead className={HEAD}>Variants</TableHead>
                <TableHead className={HEAD}>Out of stock</TableHead>
                <TableHead className={HEAD}>Low stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.locations.map((loc) => (
                <TableRow key={loc.location_id}>
                  <TableCell className="font-medium text-foreground">{loc.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(loc.units)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(loc.stock_value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${loc.value_share ?? 0}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {loc.value_share === null ? "—" : formatPercent(loc.value_share)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(loc.variants)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {loc.out_of_stock > 0 ? (
                      <span className="font-semibold text-destructive">
                        {formatNumber(loc.out_of_stock)}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {loc.low_stock > 0 ? (
                      <span className="font-semibold text-warning">
                        {formatNumber(loc.low_stock)}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
