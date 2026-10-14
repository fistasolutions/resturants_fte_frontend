import { AlertTriangle, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  barWidth,
  formatPct,
  formatShortDate,
  nexusStatusClass,
  nexusStatusLabel,
} from "@/lib/planning-format";
import { cn } from "@/lib/utils";
import type { NexusState, NexusThresholds } from "@/types/planning";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: NexusThresholds | null;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums";

const NEEDS_ATTENTION = new Set(["exceeded", "approaching", "watch"]);

/**
 * Nexus Watch (SPEC-221, backend SPEC-230).
 *
 * Split deliberately into two tables. On live data 51 of 52 states read
 * "registered", and a single ranked list buried the one state that actually needed
 * a decision under fifty rows of noise. Worse, a registered state has no threshold
 * left to cross, so its progress bar ("571%", "999+%") and its order count
 * ("17,296 / 100") were measuring against a line already behind it.
 *
 * The coverage banner stays first and unconditional while coverage is incomplete: a
 * threshold page that looked complete would report "clear" for a state it cannot see.
 */
export function NexusView({ data }: Props) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load nexus thresholds. Try again shortly.
        </p>
      </Card>
    );
  }

  const { coverage, states } = data;
  const attention = states.filter((s) => NEEDS_ATTENTION.has(s.status));
  const registered = states.filter((s) => s.status === "registered");
  const clear = states.filter((s) => s.status === "clear");

  return (
    <div className="flex flex-col gap-4">
      {!coverage.complete ? (
        <Card className="flex gap-3 border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Incomplete destination data — every figure below is a floor
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(coverage.with_destination)} of{" "}
              {formatNumber(coverage.shippable)} shippable orders ({coverage.pct}%)
              carry a destination. The real totals can only be higher, so a state
              reading &ldquo;clear&rdquo; here is not evidence that it is.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(coverage.in_store)} in-store orders are excluded — a
              counter sale has no shipping address, and is not a remote sale into
              another state.
            </p>
          </div>
        </Card>
      ) : null}

      <section aria-label="States needing attention" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">Needs a decision</h2>
          <span className="text-xs text-muted-foreground">
            {formatNumber(attention.length)} of {formatNumber(states.length)} states
          </span>
        </div>

        {attention.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <ShieldCheck className="size-6 text-success" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              No state is approaching a threshold
            </p>
            <p className="max-w-lg text-sm text-muted-foreground">
              Every state you sell into is either already registered or well below its
              registration limit
              {coverage.complete ? "." : " on the destinations we can currently see."}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem]">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className={HEAD_LEFT} scope="col">State</th>
                    <th className={HEAD_LEFT} scope="col">Status</th>
                    <th className={HEAD} scope="col">Sales</th>
                    <th className={HEAD_LEFT} scope="col">Against threshold</th>
                    <th className={HEAD} scope="col">Orders</th>
                    <th className={HEAD_LEFT} scope="col">Rule</th>
                    <th className={HEAD} scope="col">Projected crossing</th>
                  </tr>
                </thead>
                <tbody>
                  {attention.map((row) => (
                    <AttentionRow key={row.state} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {registered.length > 0 ? (
        <section aria-label="Registered states" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Already collecting tax
            </h2>
            <span className="text-xs text-muted-foreground">
              {formatNumber(registered.length)} states · no threshold left to cross
            </span>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem]">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className={HEAD_LEFT} scope="col">State</th>
                    <th className={HEAD} scope="col">Sales (12m)</th>
                    <th className={HEAD} scope="col">Orders</th>
                    <th className={HEAD_LEFT} scope="col">Registration rule</th>
                  </tr>
                </thead>
                <tbody>
                  {registered.map((row) => (
                    <tr key={row.state} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-left text-sm font-medium text-foreground">
                        {row.state}
                      </td>
                      <td className={CELL}>{formatCurrency(row.sales)}</td>
                      <td className={CELL}>{formatNumber(row.transactions)}</td>
                      <td className="px-3 py-2 text-left text-xs text-muted-foreground">
                        {row.rule ?? "No rule configured"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : null}

      {clear.length > 0 ? (
        <Card className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Well below threshold ({formatNumber(clear.length)})
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {clear.map((s) => s.state).join(" · ")}
          </p>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Threshold rules last reviewed {formatShortDate(data.reviewed_on)}. This is a{" "}
          <span className="font-medium text-foreground">monitoring aid, not tax advice</span>
          {" "}— registration decisions belong to you and your accountant.
        </p>
      </Card>
    </div>
  );
}

function AttentionRow({ row }: { row: NexusState }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-2.5 text-left text-sm font-medium text-foreground">
        {row.state}
      </td>
      <td className="px-3 py-2.5 text-left">
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
            nexusStatusClass(row.status),
          )}
        >
          {nexusStatusLabel(row.status)}
        </span>
      </td>
      <td className={CELL}>{formatCurrency(row.sales)}</td>
      <td className="px-3 py-2.5 text-left">
        {row.threshold_sales === null ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" role="presentation">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{ width: `${barWidth(row.sales_pct)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatPct(row.sales_pct)}
            </span>
          </div>
        )}
      </td>
      <td className={CELL}>
        {formatNumber(row.transactions)}
        {row.threshold_transactions !== null ? (
          <span className="ml-1 text-xs text-muted-foreground">
            / {formatNumber(row.threshold_transactions)}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-left text-xs text-muted-foreground">
        {row.rule ?? "No rule configured"}
      </td>
      <td className={`${CELL} text-muted-foreground`}>
        {formatShortDate(row.projected_crossing_date)}
      </td>
    </tr>
  );
}
