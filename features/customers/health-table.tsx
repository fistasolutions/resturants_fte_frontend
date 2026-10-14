"use client";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import {
  ALL_SOURCES,
  coverageLine,
  healthBadgeClass,
  healthSpan,
  healthTiles,
  lastOrderCell,
  refundsCell,
  returnsCell,
  ticketsCell,
  type CountCell,
} from "@/lib/customer-health";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { isGuided } from "@/lib/company-switches";
import { cn } from "@/lib/utils";
import type { CustomerHealthData, CustomerHealthRow } from "@/types/customers";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: CustomerHealthData;
}

const HEAD =
  "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums";

const TONE_TEXT: Record<string, string> = {
  plain: "text-foreground",
  bad: "text-destructive",
  warn: "text-warning",
  neutral: "text-foreground",
  good: "text-success",
};

function Count({ cell }: { cell: CountCell }) {
  return (
    <span className={cn(cell.open ? "font-semibold text-warning" : cell.text === "—" ? "text-muted-foreground" : "text-foreground")}>
      {cell.text}
    </span>
  );
}

function VerdictBadge({ c }: { c: CustomerHealthRow }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
        healthBadgeClass(c.verdictTone),
      )}
    >
      {c.verdictLabel}
    </span>
  );
}

/**
 * Customers → Health (SPEC-247). One row per top customer: Shopify spend and refunds,
 * Loop returns, Gorgias tickets, the verdict the backend drew (SPEC-253) and the
 * sentence behind it — sorted so the thing to act on today is at the top. Nothing
 * here is computed (root Rule 8).
 */
export function HealthTable({ data }: Props) {
  const { summary, customers } = data;
  // SPEC-365: a guided organization sees the Returns and Tickets columns only with their apps;
  // a full one (FOC) keeps both, as before. The window's words follow the store's own history.
  const { visibility, connected } = useWorkspace();
  const sources = isGuided(visibility)
    ? { loop: connected.includes("loop"), gorgias: connected.includes("gorgias") }
    : ALL_SOURCES;
  const span = healthSpan(data);

  if (customers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No orders in the last 12 months</p>
        <p className="mt-1 text-xs text-muted-foreground">The table fills as soon as customers buy.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Customer health summary" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {healthTiles(summary, span).map((tile) => (
          <Card key={tile.key} className="relative p-4">
            <ExplainButton target={{ metric: tile.label, value: tile.value, detail: tile.sub }} />
            <p className="pr-6 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-bold tabular-nums",
                tile.value === "0" ? "text-muted-foreground" : TONE_TEXT[tile.tone],
              )}
            >
              {tile.value}
            </p>
            {tile.sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{tile.sub}</p> : null}
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">{coverageLine(data, sources)}</p>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(HEAD, "text-left")}>Customer</th>
                <th className={cn(HEAD, "text-left")}>Verdict</th>
                <th className={HEAD}>Spent</th>
                <th className={HEAD}>Orders</th>
                <th className={HEAD}>Last order</th>
                <th className={HEAD}>Refunds</th>
                {sources.loop ? <th className={HEAD}>Returns</th> : null}
                {sources.gorgias ? <th className={HEAD}>Tickets</th> : null}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId} className="border-b border-border last:border-0 hover:bg-accent/40">
                  <td className="max-w-[220px] px-3 py-2.5 text-left text-sm">
                    <span className="block truncate font-medium text-foreground" title={c.name}>
                      {c.name}
                    </span>
                    {c.email ? (
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground" title={c.email}>
                        {c.email}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">No email on file</span>
                    )}
                  </td>
                  <td className="max-w-md px-3 py-2.5 text-left text-sm">
                    <VerdictBadge c={c} />
                    <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{c.why}</span>
                  </td>
                  <td className={cn(CELL, "font-semibold text-foreground")}>{formatCurrency(c.spent)}</td>
                  <td className={cn(CELL, "text-foreground")}>{formatNumber(c.orders)}</td>
                  <td className={cn(CELL, "whitespace-nowrap text-muted-foreground")}>{lastOrderCell(c)}</td>
                  <td className={cn(CELL, "whitespace-nowrap", c.verdict === "draining" ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    {refundsCell(c)}
                  </td>
                  {sources.loop ? (
                    <td className={cn(CELL, "whitespace-nowrap")}>
                      <Count cell={returnsCell(c)} />
                    </td>
                  ) : null}
                  {sources.gorgias ? (
                    <td className={cn(CELL, "whitespace-nowrap")}>
                      <Count cell={ticketsCell(c)} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
