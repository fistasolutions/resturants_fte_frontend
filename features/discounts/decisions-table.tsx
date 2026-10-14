import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  decisionBadgeClass,
  givenCell,
  givenLine,
  hasComparison,
  marginCell,
  noComparisonLine,
  ordersCell,
  revenueCell,
  summaryTiles,
  windowText,
  type CompareCell,
} from "@/lib/discount-decisions";
import { cn } from "@/lib/utils";
import type { DiscountDecision, DiscountDecisionsData } from "@/types/analysis";
import { formatNumber } from "@/utils/format";

interface Props {
  data: DiscountDecisionsData;
}

const HEAD =
  "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums";

const TONE_TEXT: Record<string, string> = {
  plain: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
  neutral: "text-foreground",
  muted: "text-muted-foreground",
};

function Compare({ cell }: { cell: CompareCell }) {
  if (cell.delta === null) {
    return <span className={cn(cell.text === "—" ? "text-muted-foreground" : TONE_TEXT[cell.tone])}>{cell.text}</span>;
  }
  return (
    <>
      <span className="text-foreground">{cell.text}</span>
      <span className={cn("block text-[11px] font-semibold", TONE_TEXT[cell.tone])}>{cell.delta}</span>
    </>
  );
}

function VerdictBadge({ d }: { d: DiscountDecision }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
        decisionBadgeClass(d.verdictTone),
      )}
    >
      {d.verdictLabel}
    </span>
  );
}

/**
 * Discounts → Decisions (SPEC-244). One row per code that ran: what it gave and to
 * whom, then what the whole store did per day while it ran vs the days just before —
 * orders, revenue, cost-known margin — and the verdict the backend drew (SPEC-251).
 * Movement, not attribution; always-on credits get no comparison and say so.
 */
export function DecisionsTable({ data }: Props) {
  const { summary, decisions } = data;
  const compared = hasComparison(decisions);

  if (decisions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No codes ran in this period</p>
        <p className="mt-1 text-xs text-muted-foreground">Widen the date range.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Discount decisions summary" className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {summaryTiles(summary).map((tile) => (
          <Card key={tile.key} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums", TONE_TEXT[tile.tone])}>
              {tile.value}
            </p>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{givenLine(summary)}.</span> Store figures
        are the whole store per day while the code ran vs the same number of days just
        before — movement, not attribution. Ran is the code&apos;s own start and end in
        Shopify; a hand-typed POS title has none, so its first and last use stand in. A code
        with no end date, or in use most of the period, is{" "}
        <span className="font-medium text-foreground">always on</span>: there is no before to
        compare; its cost is on{" "}
        <Link
          href="/discounts/cannibalisation"
          className="rounded text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cannibalisation
        </Link>
        .
      </p>

      {!compared ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground" role="status">
          {noComparisonLine(summary)}
        </p>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(HEAD, "text-left")}>Code</th>
                <th className={cn(HEAD, "text-left")}>Verdict</th>
                <th className={cn(HEAD, "text-left")}>Ran</th>
                <th className={HEAD}>Orders</th>
                <th className={cn(HEAD, "text-left")}>Given</th>
                {compared ? (
                  <>
                    <th className={HEAD}>Orders / day</th>
                    <th className={HEAD}>Revenue / day</th>
                    <th className={HEAD}>Margin</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => {
                const quiet = d.verdict === "too_small";
                return (
                  <tr
                    key={d.code}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-accent/40",
                      quiet && "opacity-70",
                    )}
                  >
                    <td className="px-3 py-2.5 text-left text-sm">
                      <span className="font-medium text-foreground">{d.code}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatNumber(d.newCustomers)} new · {formatNumber(d.existingOrders)} existing
                      </span>
                    </td>
                    <td className="max-w-md px-3 py-2.5 text-left text-sm">
                      <VerdictBadge d={d} />
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        {d.why}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-left text-xs text-muted-foreground">
                      {windowText(d)}
                    </td>
                    <td className={`${CELL} text-foreground`}>{formatNumber(d.codeOrders)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-left text-sm tabular-nums text-foreground">
                      {givenCell(d)}
                    </td>
                    {compared ? (
                      <>
                        <td className={CELL}>
                          <Compare cell={ordersCell(d)} />
                        </td>
                        <td className={CELL}>
                          <Compare cell={revenueCell(d)} />
                        </td>
                        <td className={CELL}>
                          <Compare cell={marginCell(d)} />
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
