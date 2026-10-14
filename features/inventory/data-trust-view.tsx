"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";

import { Card } from "@/components/ui/card";
import {
  correctionSentence,
  isMateriallyContaminated,
  ruleStatusLabel,
  sortRules,
} from "@/lib/data-trust";
import { cn } from "@/lib/utils";
import type { DataTrustReport, DataTrustRule } from "@/types/data-trust";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: DataTrustReport | null;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by check, explanation or what it affects; facet on the status (SPEC-258). */
const CONTROLS: TableSpec<DataTrustRule> = {
  search: (rule) => [rule.label, rule.explanation, rule.affects.join(" ")],
  facet: (rule) => ruleStatusLabel(rule),
};
const COLUMNS = 5;

/**
 * Data Trust (SPEC-217). The catalogue contains test products left ACTIVE in
 * Shopify; the backend excludes them from every stock figure. This page is the
 * disclosure that makes that correction auditable.
 *
 * The uncorrected figure stays on the page permanently and deliberately — a
 * correction the reader cannot audit is just a different unexplained number.
 *
 * We are read-only toward Shopify (root Rule 8), so every action names what the
 * merchant must do in their own admin. Nothing here offers to fix the catalogue.
 */
export function DataTrustView({ data }: Props) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not run the integrity checks. Try again shortly.
        </p>
      </Card>
    );
  }

  const { summary } = data;
  const rules = sortRules(data.rules);
  const correction = correctionSentence(data);
  const material = isMateriallyContaminated(summary.excludedSharePct);

  if (rules.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
        <p className="text-sm font-medium text-foreground">No integrity issues found</p>
        <p className="text-sm text-muted-foreground">
          Every product in the catalogue passed all checks.
        </p>
      </Card>
    );
  }

  return (
    // Bottom clearance keeps the pager clear of the Ask Glisp pill.
    <div className="flex flex-col gap-4 pb-16">
      <section aria-label="Stock value correction" className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Raw catalogue says
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-muted-foreground line-through decoration-1">
            {formatCurrency(summary.stockValueReported)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Excluded as test data
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-warning">
            {formatCurrency(summary.stockValueExcluded)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.excludedSharePct}% of reported value
          </p>
        </Card>
        <Card className={cn("p-4", material && "border-foreground/25")}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            What we report
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(summary.stockValueTrusted)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used by every stock figure
          </p>
        </Card>
      </section>

      {correction ? (
        <Card className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-sm text-foreground">{correction}</p>
        </Card>
      ) : null}

      <DataTrustChecksTable rules={rules} />

      {rules
        .filter((rule) => rule.samples.length > 0)
        .map((rule) => (
          <Card key={`${rule.key}-samples`} className="p-5">
            <h2 className="text-sm font-semibold text-foreground">
              {rule.label} — archive these in Shopify
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {rule.samples.map((sample) => (
                <li
                  key={sample.productId}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="font-medium text-foreground">{sample.title}</span>
                  <span className="tabular-nums text-muted-foreground">{sample.detail}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
    </div>
  );
}

/** The table with its own search, status chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — nothing above it moves. */
function DataTrustChecksTable({ rules }: { rules: DataTrustRule[] }) {
  const t = useTableControls(rules, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="checks"
        facetLabel="Status"
        query={t.query}
        onQuery={t.setQuery}
        facets={t.facets}
        facet={t.facet}
        onFacet={t.setFacet}
        matches={t.matches}
        total={t.total}
        active={t.active}
        onClear={t.clear}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={HEAD_LEFT}>Check</th>
              <th className={HEAD}>Found</th>
              <th className={HEAD}>Value</th>
              <th className={HEAD_LEFT}>Status</th>
              <th className={HEAD_LEFT}>Affects</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="checks" onClear={t.clear} /> : null}
            {t.rows.map((rule) => (
              <tr key={rule.key} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 text-left text-sm">
                  <span className="font-medium text-foreground">{rule.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {rule.explanation}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-foreground">
                    {rule.action}
                  </span>
                </td>
                <td className={`${CELL} text-foreground`}>{formatNumber(rule.count)}</td>
                <td
                  className={cn(
                    CELL,
                    rule.valueImpact === null
                      ? "text-muted-foreground"
                      : "font-semibold text-warning",
                  )}
                >
                  {rule.valueImpact === null ? "—" : formatCurrency(rule.valueImpact)}
                </td>
                <td className="px-3 py-2.5 text-left">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                      rule.excluded
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {ruleStatusLabel(rule)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-left text-xs text-muted-foreground">
                  {rule.affects.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="checks" onPage={t.setPage} />
</Card>
  );
}
