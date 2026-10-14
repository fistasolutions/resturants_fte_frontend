"use client";

import { Card } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";
import type { CannibalisationCode, CannibalisationData } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: CannibalisationData;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by code; facet on the finding (SPEC-258). */
const CONTROLS: TableSpec<CannibalisationCode> = {
  search: (code) => [code.code],
  facet: (code) => code.verdict,
};
const COLUMNS = 8;

function Verdict({ code }: { code: CannibalisationCode }) {
  const tone =
    code.verdictTone === "bad"
      ? "bg-destructive/10 text-destructive"
      : code.verdictTone === "warn"
        ? "bg-warning/10 text-warning"
        : code.verdictTone === "good"
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-block rounded-md whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {code.verdict}
    </span>
  );
}

/**
 * Discounts → Cannibalisation (SPEC-186). Per code, how much of the discount went
 * to customers who had already bought.
 *
 * The verdict names the finding, never an instruction: the biggest codes here are
 * operational credits staff apply by hand (damaged goods, replacements), which are
 * existing-customer by nature. "Not acquiring" is true of those and of a failed
 * campaign; deciding which is which is the owner's call, not the page's.
 */
export function CannibalisationTable({ data }: Props) {
  const { summary, codes } = data;

  if (codes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No discount codes used in this period</p>
        <p className="mt-1 text-xs text-muted-foreground">Widen the date range to see more.</p>
      </Card>
    );
  }

  return (
    // Bottom clearance keeps the pager clear of the Ask Glisp pill.
    <div className="flex flex-col gap-4 pb-16">
      <section aria-label="Cannibalisation summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Discount given
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(summary.discountGiven)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            To existing customers
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-destructive">
            {formatCurrency(summary.discountToExisting)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.existingSharePct}% of all discount
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            New customers won
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.newCustomers)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            across {formatNumber(summary.codesCounted)} codes
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Acquiring nobody
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.notAcquiringCodes)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCurrency(summary.notAcquiringSpend)} of discount
          </p>
        </Card>
      </section>

      <CannibalisationCodesTable codes={codes} />
    </div>
  );
}

/** The table with its own search, finding chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — nothing above it moves. */
function CannibalisationCodesTable({ codes }: { codes: CannibalisationCode[] }) {
  const t = useTableControls(codes, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="codes"
        facetLabel="Finding"
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
              <th className={HEAD_LEFT}>Code</th>
              <th className={HEAD}>Orders</th>
              <th className={HEAD}>Discount given</th>
              <th className={HEAD}>To existing</th>
              <th className={HEAD}>Existing share</th>
              <th className={HEAD}>New customers</th>
              <th className={HEAD}>Cost / new</th>
              <th className={HEAD_LEFT}>Finding</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="codes" onClear={t.clear} /> : null}
            {t.rows.map((code) => (
              <tr
                key={code.code}
                className="border-b border-border last:border-0 hover:bg-accent/40"
              >
                <td className="px-3 py-2.5 text-left text-sm font-medium text-foreground">
                  {code.code}
                  {code.unattributedOrders > 0 && (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {formatNumber(code.unattributedOrders)} guest order
                      {code.unattributedOrders === 1 ? "" : "s"} — not attributable
                    </span>
                  )}
                </td>
                <td className={`${CELL} text-muted-foreground`}>{formatNumber(code.orders)}</td>
                <td className={`${CELL} text-foreground`}>
                  {formatCurrency(code.discountGiven)}
                </td>
                <td className={`${CELL} text-destructive`}>
                  {formatCurrency(code.discountToExisting)}
                </td>
                <td className={`${CELL} text-muted-foreground`}>{code.existingSharePct}%</td>
                <td className={`${CELL} text-foreground`}>
                  {formatNumber(code.newCustomers)}
                </td>
                <td className={`${CELL} text-muted-foreground`}>
                  {code.costPerNewCustomer === null
                    ? "—"
                    : formatCurrency(code.costPerNewCustomer)}
                </td>
                <td className="px-3 py-2.5 text-left">
                  <Verdict code={code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="codes" onPage={t.setPage} />
</Card>
  );
}
