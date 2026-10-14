"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { TablePager } from "@/components/shared/table-pager";
import { FlagChips, NUM, TD, TH } from "@/features/finance/finance-ui";
import {
  PAGE_SIZE,
  daysUntil,
  dueLabel,
  financeBillHref,
  pageOf,
  sortBills,
  sumBalance,
  type SortKey,
} from "@/lib/finance";
import { originalLine } from "@/lib/finance-currency";
import { cn } from "@/lib/utils";
import type { Bill, GroupBy } from "@/types/finance";
import { formatCurrency, formatDate } from "@/utils/format";

const COLUMNS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: "vendor", label: "Vendor" },
  { key: "company", label: "Company" },
  { key: "number", label: "Bill no." },
  { key: "billedOn", label: "Bill date", num: true },
  { key: "dueOn", label: "Due", num: true },
  { key: "amount", label: "Original", num: true },
  { key: "balance", label: "Balance", num: true },
  { key: "status", label: "Status" },
];

/**
 * The bills the client listed, column for column (SPEC-296, SPEC-301). Sorting, grouping
 * and paging are component state over rows already in hand — a click re-renders the
 * table, never the route. Figures are right-aligned and tabular; a total row sums what
 * the table holds; grouped tables put each group's full subtotal on its header row, even
 * when the group runs across two pages.
 */
export function BillsTable({
  bills,
  today,
  group = "none",
  empty = "No bills match these filters.",
}: {
  bills: Bill[];
  today: Date;
  group?: GroupBy;
  empty?: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "dueOn", dir: 1 });
  const [page, setPage] = useState(1);

  const sorted = sortBills(bills, sort.key, sort.dir);
  // Grouping keeps the chosen sort inside each group; groups sort by name.
  const ordered =
    group === "none"
      ? sorted
      : [...sorted].sort((a, b) => a[group].localeCompare(b[group]));
  const paged = pageOf(ordered, page, PAGE_SIZE);
  const subtotals = new Map<string, { count: number; balance: number }>();
  if (group !== "none") {
    for (const bill of ordered) {
      const key = bill[group];
      const prev = subtotals.get(key) ?? { count: 0, balance: 0 };
      subtotals.set(key, { count: prev.count + 1, balance: prev.balance + bill.balance });
    }
  }

  const press = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
    setPage(1);
  };
  const open = (bill: Bill) => router.push(financeBillHref(bill));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sort.key === column.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                  className={cn(TH, column.num ? "text-right" : "text-left")}
                >
                  <button
                    type="button"
                    onClick={() => press(column.key)}
                    className={cn(
                      "inline-flex items-center gap-1 uppercase tracking-widest outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                      column.num && "flex-row-reverse",
                    )}
                  >
                    {column.label}
                    {sort.key === column.key ? (
                      sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.rows.map((bill, index) => {
              const overdue = daysUntil(bill.dueOn, today);
              const groupKey = group === "none" ? null : bill[group];
              const startsGroup =
                groupKey !== null && (index === 0 || paged.rows[index - 1][group as "company" | "vendor"] !== groupKey);
              const sub = groupKey !== null ? subtotals.get(groupKey) : undefined;
              return (
                <Fragment key={bill.id}>
                  {startsGroup && sub && (
                    <tr className="bg-muted/60">
                      <td colSpan={6} className="px-3 py-1.5 text-xs font-bold">
                        {groupKey} <span className="font-medium text-muted-foreground">· {sub.count} {sub.count === 1 ? "bill" : "bills"}</span>
                      </td>
                      <td className={cn(TD, NUM, "py-1.5 text-xs font-bold")}>{formatCurrency(sub.balance)}</td>
                      <td />
                    </tr>
                  )}
                  <tr
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ${bill.vendor} ${bill.number}`}
                    onClick={() => open(bill)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        open(bill);
                      }
                    }}
                    className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50"
                  >
                    <td className="max-w-[16rem] px-3 py-2">
                      <span className="block truncate text-sm font-semibold">{bill.vendor}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {bill.category}
                        {bill.memo ? ` · ${bill.memo}` : ""}
                      </span>
                    </td>
                    <td className={TD}>
                      <StatusBadge tone="neutral">{bill.company}</StatusBadge>
                    </td>
                    <td className={cn(TD, "font-mono text-xs text-muted-foreground")}>{bill.number}</td>
                    <td className={cn(TD, NUM, "text-xs text-muted-foreground")}>{formatDate(bill.billedOn)}</td>
                    <td
                      className={cn(
                        TD,
                        NUM,
                        "text-sm",
                        overdue < 0 ? "font-semibold text-destructive" : overdue <= 7 ? "font-semibold text-warning" : "",
                      )}
                    >
                      {formatDate(bill.dueOn)}
                      <span className="block text-[11px] font-normal">{dueLabel(bill, today)}</span>
                    </td>
                    <td className={cn(TD, NUM, "text-sm")}>{formatCurrency(bill.amount)}</td>
                    <td className={cn(TD, NUM, "text-sm font-semibold")}>
                      {formatCurrency(bill.balance)}
                      {originalLine(bill) && (
                        // SPEC-331 — a converted bill shows what QuickBooks wrote.
                        <span className="block text-[11px] font-normal text-muted-foreground">{originalLine(bill)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap items-center gap-1">
                        <StatusBadge tone={bill.status === "partial" ? "info" : overdue < 0 ? "destructive" : "neutral"}>
                          {bill.status === "partial" ? "Partially paid" : overdue < 0 ? "Past due" : "Open"}
                        </StatusBadge>
                        <FlagChips flags={bill.flags} amount={bill.amount} />
                      </span>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {paged.rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
          {ordered.length > 0 && (
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={5} className="px-3 py-2 text-xs font-bold">
                  Total · {ordered.length} {ordered.length === 1 ? "bill" : "bills"}
                </td>
                <td className={cn(TD, NUM, "text-xs font-bold")}>
                  {formatCurrency(ordered.reduce((t, b) => t + b.amount, 0))}
                </td>
                <td className={cn(TD, NUM, "text-xs font-bold")}>{formatCurrency(sumBalance(ordered))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <TablePager
        page={paged.page}
        pages={paged.pages}
        pageSize={PAGE_SIZE}
        matches={ordered.length}
        noun="bills"
        onPage={setPage}
      />
    </>
  );
}
