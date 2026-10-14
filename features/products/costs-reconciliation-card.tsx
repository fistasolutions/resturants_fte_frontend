import { Card } from "@/components/ui/card";
import { reconciliationLines } from "@/lib/costs";
import { cn } from "@/lib/utils";
import type { ApiCostReconciliation } from "@/types/costs";
import { formatDate, formatNumber } from "@/utils/format";

interface Props {
  reconciliation: ApiCostReconciliation;
  period: { start: string; end: string };
}

const TONE: Record<"plain" | "muted" | "warn", string> = {
  plain: "text-foreground",
  muted: "text-muted-foreground",
  warn: "text-warning",
};

/**
 * Reconciliation (SPEC-251 §6): what was recorded against what the invoices said,
 * for shipments received in the period, with the variance named by the backend.
 */
export function CostsReconciliationCard({ reconciliation, period }: Props) {
  const lines = reconciliationLines(reconciliation);
  return (
    <Card className="gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Reconciliation</h2>
        <p className="text-xs text-muted-foreground">
          Shipments received {formatDate(period.start)} – {formatDate(period.end)}:{" "}
          {formatNumber(reconciliation.shipments)} shipment{reconciliation.shipments === 1 ? "" : "s"},{" "}
          {formatNumber(reconciliation.rows)} costed lots.
        </p>
      </div>
      <dl className="flex flex-col gap-1.5">
        {lines.map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-3">
            <dt className={cn("text-xs", line.label.startsWith("↳") ? "pl-2 text-muted-foreground" : "text-muted-foreground")}>
              {line.label}
            </dt>
            <dd className={cn("text-sm font-medium tabular-nums", TONE[line.tone])}>{line.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] leading-snug text-muted-foreground">
        The variance is, by construction, the part of the recorded cost that came from
        assumptions rather than an invoice.{" "}
        {reconciliation.manual_entries > 0
          ? `${formatNumber(reconciliation.manual_entries)} manual ${reconciliation.manual_entries === 1 ? "entry" : "entries"} in the period carry no invoice and are not folded in.`
          : "No manual entries in the period."}
      </p>
    </Card>
  );
}
