import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  PackageCheck,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  destinationLabel,
  directionLabel,
  rowActionHref,
  rowActionLabel,
} from "@/lib/transfer-plan";
import type {
  TransferDirection,
  TransferPlan as TransferPlanData,
  TransferPlanRow,
  TransferUrgency,
} from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const DIRECTION_ICON: Record<TransferDirection, LucideIcon> = {
  warehouse_to_store: Warehouse,
  store_to_store: ArrowRightLeft,
};

// Urgency is a status — the one place status color is allowed (RULE 9). Only
// warehouse rows carry it; store→store rows are always null.
const URGENCY_STRIPE: Record<TransferUrgency, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-transparent",
  low: "bg-transparent",
};

const URGENCY_PILL: Record<TransferUrgency, string> = {
  critical: "bg-destructive/10 text-destructive border border-destructive/20",
  high: "bg-warning/10 text-warning border border-warning/20",
  medium: "",
  low: "",
};

function LocationPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
      {children}
    </span>
  );
}

function PlanRow({ row, rank }: { row: TransferPlanRow; rank: number }) {
  const Icon = DIRECTION_ICON[row.direction];
  const showUrgency = row.urgency === "critical" || row.urgency === "high";

  return (
    <li>
      <Card className="relative overflow-hidden p-0">
        {/* Urgency accent stripe */}
        {showUrgency && (
          <span
            className={`absolute inset-y-0 left-0 w-0.5 ${URGENCY_STRIPE[row.urgency!]}`}
            aria-hidden
          />
        )}

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Rank + money */}
          <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
            <span className="w-6 shrink-0 text-sm font-medium tabular-nums text-muted-foreground/70">
              {String(rank).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(row.opportunity_value)}
              </p>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Opportunity
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                  {directionLabel(row.direction)}
                </span>
                {showUrgency && (
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize ${URGENCY_PILL[row.urgency!]}`}
                  >
                    {row.urgency}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate font-medium text-foreground" title={row.title}>
                {row.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.reason}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <LocationPill>{row.from_location}</LocationPill>
                <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                <LocationPill>{destinationLabel(row)}</LocationPill>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span className="text-xs font-medium text-foreground">
                  Move {formatNumber(row.suggested_units)}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
            <Link href={rowActionHref(row)}>
              {rowActionLabel(row)}
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Card>
    </li>
  );
}

function MiniStat({
  icon: Icon,
  label,
  moves,
  value,
}: {
  icon: LucideIcon;
  label: string;
  moves: number;
  value: number;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5">
      <span
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(value)}
        </p>
        <p className="text-xs text-muted-foreground">{formatNumber(moves)} moves</p>
      </div>
    </div>
  );
}

/** Unified, dollar-ranked transfer plan (SPEC-086) — the hero of the Transfers
 * tab. Renders above the existing per-direction detail tables. */
export function TransferPlan({ plan }: { plan: TransferPlanData }) {
  const { summary, rows } = plan;

  return (
    <section aria-label="Transfer plan" className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Transfer Plan</h2>
        <p className="text-xs text-muted-foreground">
          The highest-value stock moves to make now — ranked by dollars.
        </p>
      </div>

      {/* Summary hero */}
      <Card className="px-5 py-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Total opportunity to act on
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {formatCurrency(summary.total_opportunity_value)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              in stock moves to make this week — biggest dollars first.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:w-80 sm:grid-cols-2">
            <MiniStat
              icon={Warehouse}
              label="Warehouse → Store"
              moves={summary.warehouse_to_store.rows}
              value={summary.warehouse_to_store.value}
            />
            <MiniStat
              icon={ArrowRightLeft}
              label="Store → Store"
              moves={summary.store_to_store.rows}
              value={summary.store_to_store.value}
            />
          </div>
        </div>
      </Card>

      {/* Ranked rows */}
      {rows.length === 0 ? (
        <Card className="flex items-center gap-3 px-4 py-4">
          <PackageCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No transfers needed right now — every in-demand style is where it sells.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <PlanRow
              key={`${row.direction}-${row.product_id}-${row.from_location}-${row.to_location_id ?? "wh"}`}
              row={row}
              rank={i + 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
