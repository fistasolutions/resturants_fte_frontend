import { Download, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ReorderAlert } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

// ── Cover color thresholds ────────────────────────────────────────────────────

function coverClass(days: number): string {
  if (days <= 7) return "font-bold text-destructive";
  if (days <= 14) return "font-semibold text-warning";
  return "font-medium text-warning/80";
}

function coverLabel(days: number): string {
  if (days === 0) return "Out of stock";
  return `${days}d`;
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ReorderRow({ alert }: { alert: ReorderAlert }) {
  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <span
          className="block max-w-[180px] truncate font-medium text-foreground"
          title={alert.title}
        >
          {alert.title}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-foreground">
        {formatNumber(alert.stock)}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums ${coverClass(alert.days_of_cover)}`}>
        {coverLabel(alert.days_of_cover)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
        {formatCurrency(alert.revenue_at_risk)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
        {formatNumber(alert.units_to_reorder)}
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReorderTableProps {
  alerts: ReorderAlert[];
  /** Raw query string for the CSV export URL, e.g. "start=2026-06-01&end=2026-07-01" */
  query: string;
}

/** Reorder now table (SPEC-045/050). Pure server component. */
export function ReorderTable({ alerts, query }: ReorderTableProps) {
  const sectionLabel = (
    <div className="flex items-center gap-3">
      <p className="shrink-0 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Reorder Now
      </p>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );

  if (alerts.length === 0) {
    return (
      <section aria-label="Reorder alerts">
        {sectionLabel}
        <Card className="mt-2 flex items-center gap-3 px-4 py-4">
          <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            All products have at least 14 days of cover — nothing urgent to reorder.
          </p>
        </Card>
      </section>
    );
  }

  const totalRisk = alerts.reduce((sum, a) => sum + a.revenue_at_risk, 0);

  return (
    <section aria-label="Reorder alerts" className="space-y-3">
      {sectionLabel}

      {/* Hero */}
      <Card className="gap-1 border-warning/30 bg-warning/[0.04] px-5 py-4">
        <p className="text-sm font-semibold text-foreground">
          {formatNumber(alerts.length)}{" "}
          {alerts.length === 1 ? "product" : "products"} about to stock out
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatCurrency(totalRisk)}
          </span>{" "}
          in weekly revenue at risk if you don&apos;t reorder now
        </p>
      </Card>

      {/* Table + export */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Product
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Stock
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Days cover
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  $/Week at risk
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Order qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts.map((a) => (
                <ReorderRow key={a.product_id} alert={a} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Export footer */}
        <div className="flex items-center justify-end border-t border-border px-4 py-3">
          <a
            href={`/api/proxy/analysis/inventory/restock-export?${query}`}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="size-3.5" aria-hidden />
            Export restock proposal
          </a>
        </div>
      </Card>
    </section>
  );
}
