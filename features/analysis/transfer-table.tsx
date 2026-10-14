"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { InventoryTransfer, InventoryTransfers, TransferUrgency } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

// ── Urgency helpers ───────────────────────────────────────────────────────────

const URGENCY_PILL: Record<TransferUrgency, string> = {
  critical: "bg-destructive/15 text-destructive border border-destructive/25",
  high:     "bg-warning/15 text-warning border border-warning/25",
  medium:   "bg-warning/10 text-warning/80 border border-warning/20",
  low:      "bg-muted/60 text-muted-foreground border border-border/60",
};

const URGENCY_LABEL: Record<TransferUrgency, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

const DAYS_COLOR: Record<TransferUrgency, string> = {
  critical: "font-bold text-destructive",
  high:     "font-semibold text-warning",
  medium:   "font-medium text-warning/80",
  low:      "text-muted-foreground",
};

function topUrgency(transfers: InventoryTransfer[]): TransferUrgency {
  if (transfers.some((t) => t.urgency === "critical")) return "critical";
  if (transfers.some((t) => t.urgency === "high")) return "high";
  if (transfers.some((t) => t.urgency === "medium")) return "medium";
  return "low";
}

const HERO_BORDER: Record<TransferUrgency, string> = {
  critical: "border-destructive/30 bg-destructive/[0.04]",
  high:     "border-warning/30 bg-warning/[0.04]",
  medium:   "border-border bg-muted/30",
  low:      "border-border bg-muted/30",
};

// ── Transfer row ──────────────────────────────────────────────────────────────

function TransferRow({ t }: { t: InventoryTransfer }) {
  const daysLabel =
    t.days_of_cover === 0
      ? "Out of stock"
      : `${t.days_of_cover}d left`;

  const askWhy = `/chat?q=${encodeURIComponent(
    `Why is ${t.title} running low in the store while warehouse stock sits idle? How many units should I transfer?`,
  )}`;

  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${URGENCY_PILL[t.urgency]}`}
          >
            {URGENCY_LABEL[t.urgency]}
          </span>
          <span
            className="block max-w-[160px] truncate font-medium text-foreground"
            title={t.title}
          >
            {t.title}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-foreground">
        {formatNumber(t.warehouse_units)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-foreground">
        {formatNumber(t.store_units)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
        {formatNumber(t.units_sold)}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums ${DAYS_COLOR[t.urgency]}`}>
        {daysLabel}
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={askWhy}
          className="whitespace-nowrap text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Ask Glisp →
        </a>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TransferTableProps {
  initialData: InventoryTransfers | null;
  /** "start=...&end=..." — the same date-range query the rest of the page uses. */
  query: string;
}

async function fetchTransfersPage(
  query: string,
  page: number,
  pageSize: number,
): Promise<InventoryTransfers> {
  const res = await fetch(
    `/api/proxy/analysis/inventory/transfers?${query}&page=${page}&page_size=${pageSize}`,
  );
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as InventoryTransfers;
}

/** Warehouse → Store transfer table (SPEC-043/048/051; client-side paging
 * SPEC-063). Paging fetches ONLY this table's data from the standalone
 * `/analysis/inventory/transfers` endpoint instead of navigating the route —
 * clicking Next/Prev no longer re-renders the rest of the Inventory Analyst
 * page (analysis tiles, dead stock, AI commentary all stay mounted). */
export function TransferTable({ initialData, query }: TransferTableProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToPage(page: number) {
    if (!data) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchTransfersPage(query, page, data.page_size);
      setData(next);
    } catch {
      setError("Could not load that page — try again.");
    } finally {
      setLoading(false);
    }
  }

  // Empty / unavailable
  if (!data || data.transfers.length === 0) {
    return (
      <section aria-label="Warehouse transfer opportunities">
        <div className="mb-2 flex items-center gap-3">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Warehouse → Store
          </p>
          <div className="h-px flex-1 bg-border" aria-hidden />
        </div>
        <Card className="flex items-center gap-3 px-4 py-4">
          <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            All in-demand products are well-stocked at store level — no transfers needed right now.
          </p>
        </Card>
      </section>
    );
  }

  const { summary, transfers, warehouse_location } = data;
  const urgency = topUrgency(transfers);

  return (
    <section aria-label="Warehouse transfer opportunities" className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Warehouse → Store
        </p>
        <div className="h-px flex-1 bg-border" aria-hidden />
      </div>

      {/* Hero card */}
      <Card className={`gap-1 px-5 py-4 ${HERO_BORDER[urgency]}`}>
        <p className="text-sm font-semibold text-foreground">
          {formatNumber(summary.products_misallocated)}{" "}
          {summary.products_misallocated === 1 ? "product" : "products"} stranded in{" "}
          {warehouse_location}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(summary.total_units_to_transfer)} units to move ·{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(summary.revenue_at_risk)}
          </span>{" "}
          in demand at risk
        </p>
      </Card>

      {/* Transfer table */}
      <Card className="overflow-hidden p-0">
        <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Product
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Warehouse
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Store
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Sold 30d
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Store cover
                </th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers.map((t) => (
                <TransferRow key={t.product_id} t={t} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {error ?? `Page ${data.page} of ${data.total_pages} · ${data.total} products`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(data.page - 1)}
              disabled={data.page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background"
            >
              <ChevronLeft className="size-3.5" aria-hidden /> Prev
            </button>
            <button
              type="button"
              onClick={() => goToPage(data.page + 1)}
              disabled={data.page >= data.total_pages || loading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background"
            >
              Next <ChevronRight className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
