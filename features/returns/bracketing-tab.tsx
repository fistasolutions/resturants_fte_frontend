"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { TablePager } from "@/components/shared/table-pager";
import { Card } from "@/components/ui/card";
import { NUM, StyleThumb, TD, TH, Tile, VerdictBadge } from "@/features/fit/fit-ui";
import {
  BRACKET_PAGE_SIZE,
  CHANNEL_LABEL,
  nextSort,
  outcomeSplit,
  pageRows,
  pctText,
  sortBracketStyles,
  type BracketSortKey,
} from "@/lib/bracketing";
import { fitStyleHref } from "@/lib/fit";
import { cn } from "@/lib/utils";
import type { BracketCustomer, BracketingData } from "@/types/bracketing";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/utils/format";

const SEGMENT_TONE: Record<string, string> = {
  keptAll: "bg-success",
  keptOne: "bg-warning",
  keptSome: "bg-info",
  returnedAll: "bg-destructive",
};

/**
 * Returns Analytics → Bracketing (SPEC-309 / backend SPEC-306): orders that held one style
 * in several sizes, how they ended, the styles that draw it, and the customers who do it
 * every time. Every figure is the backend's; this only lays it out.
 */
export function BracketingTab({ data }: { data: BracketingData }) {
  const { summary } = data;
  const split = outcomeSplit(summary);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Bracket orders"
          value={formatNumber(summary.bracketOrders)}
          sub={`${pctText(summary.bracketShare)} of ${formatNumber(summary.orders)} orders`}
        />
        <Tile label="Kept one size" value={formatNumber(summary.keptOne)} sub="sent every other size back" tone="warn" />
        <Tile label="Returned everything" value={formatNumber(summary.returnedAll)} sub="no size worked" tone="bad" />
        <Tile
          label="Refunded on brackets"
          value={formatCompactCurrency(summary.refunded)}
          sub={`${pctText(summary.refundedShare)} of all refunds`}
          tone="bad"
        />
      </div>

      <Card className="gap-3 px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">How brackets end</h2>
          <span className="text-xs text-muted-foreground">
            {formatNumber(summary.brackets)} times a style was bought in two or more sizes
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={split.map((s) => `${s.label} ${s.pct}%`).join(", ")}>
          {split.map((s) => (
            <span key={s.key} className={SEGMENT_TONE[s.key]} style={{ width: `${s.pct}%` }} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {split.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", SEGMENT_TONE[s.key])} aria-hidden />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {formatNumber(s.count)} <span className="font-normal text-muted-foreground">· {s.pct}%</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {data.channels.length > 0 && (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="border-b border-border px-3 py-2.5">
            <h2 className="text-sm font-semibold">By channel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className={cn(TH, "text-left")}>Channel</th>
                  <th className={cn(TH, NUM)}>Bracket orders</th>
                  <th className={cn(TH, NUM)}>Kept one</th>
                  <th className={cn(TH, NUM)}>Refunded</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-b border-border last:border-0">
                    <td className={cn(TD, "font-medium")}>{CHANNEL_LABEL[c.channel]}</td>
                    <td className={cn(TD, NUM)}>{formatNumber(c.bracketOrders)}</td>
                    <td className={cn(TD, NUM)}>{formatNumber(c.keptOne)}</td>
                    <td className={cn(TD, NUM, "font-semibold")}>{formatCurrency(c.refunded)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StylesCard data={data} />
      <CustomersCard data={data} />
    </div>
  );
}

const STYLE_COLUMNS: { key: BracketSortKey | null; label: string; num: boolean }[] = [
  { key: "title", label: "Style", num: false },
  { key: "orders", label: "Orders", num: true },
  { key: "bracketOrders", label: "Bracketed", num: true },
  { key: "bracketRate", label: "Rate", num: true },
  { key: "keptOne", label: "Kept one", num: true },
  { key: "refunded", label: "Refunded", num: true },
  { key: null, label: "Fit", num: false },
];

function StylesCard({ data }: { data: BracketingData }) {
  const [sort, setSort] = useState<{ key: BracketSortKey; dir: 1 | -1 }>({ key: "refunded", dir: -1 });
  const [page, setPage] = useState(1);
  const rows = useMemo(() => sortBracketStyles(data.styles, sort.key, sort.dir), [data.styles, sort]);
  const current = pageRows(rows, page);
  if (!rows.length) return null;
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-baseline gap-x-2 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">Styles that draw it</h2>
        <span className="text-xs text-muted-foreground">ranked by money refunded on bracket orders · the fit verdict comes from the Fit tab</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {STYLE_COLUMNS.map((col) => {
                const sorted = col.key !== null && sort.key === col.key;
                return (
                  <th
                    key={col.label}
                    scope="col"
                    aria-sort={sorted ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                    className={cn(TH, col.num ? "text-right" : "text-left")}
                  >
                    {col.key ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSort(nextSort(sort, col.key as BracketSortKey));
                          setPage(1);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          col.num && "flex-row-reverse",
                        )}
                      >
                        {col.label}
                        {sorted && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {current.rows.map((style) => (
              <tr key={style.productId} className="border-b border-border last:border-0">
                <td className={cn(TD, "max-w-[300px]")}>
                  <div className="flex items-center gap-3">
                    <StyleThumb src={style.imageUrl} />
                    <div className="min-w-0">
                      <span className="block truncate font-medium">{style.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{style.vendor ?? "No vendor"}</span>
                    </div>
                  </div>
                </td>
                <td className={cn(TD, NUM)}>{style.orders === null ? "—" : formatNumber(style.orders)}</td>
                <td className={cn(TD, NUM)}>{formatNumber(style.bracketOrders)}</td>
                <td className={cn(TD, NUM)}>{pctText(style.bracketRate)}</td>
                <td className={cn(TD, NUM)}>{formatNumber(style.keptOne)}</td>
                <td className={cn(TD, NUM, "font-semibold")}>{formatCurrency(style.refunded)}</td>
                <td className={TD}>
                  {style.fitVerdict ? (
                    <Link prefetch={false} href={fitStyleHref(style.productId)} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <VerdictBadge verdict={style.fitVerdict} />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={current.page} pages={current.pages} pageSize={BRACKET_PAGE_SIZE} matches={rows.length} noun="styles" onPage={setPage} />
    </Card>
  );
}

type CustomerList = "repeat" | "high";

function CustomersCard({ data }: { data: BracketingData }) {
  const [list, setList] = useState<CustomerList>("repeat");
  const rows: BracketCustomer[] = list === "repeat" ? data.repeatBracketers : data.highReturn;
  const r = data.rules;
  const explainer =
    list === "repeat"
      ? `At least ${r.repeatBracketOrders} bracket orders that ended in a return, and returns from at least ${pctText(r.repeatReturnShare, 0)} of them.`
      : `At least ${r.highReturnMinOrders} orders in the range, with ${pctText(r.highReturnRate, 0)} or more of the units bought refunded.`;
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold">Customers</h2>
        <div className="ml-auto inline-flex overflow-hidden rounded-[10px] border border-border" role="group" aria-label="Which customers">
          {(
            [
              ["repeat", `Repeat bracketers · ${data.repeatBracketers.length}`],
              ["high", `High-return · ${data.highReturn.length}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={list === key}
              onClick={() => setList(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                list === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">{explainer}</p>
      {rows.length === 0 ? (
        <p className="px-3 py-10 text-center text-sm text-muted-foreground">No customer matches this pattern in the range.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(TH, "text-left")}>Customer</th>
                <th className={cn(TH, NUM)}>Orders</th>
                <th className={cn(TH, NUM)}>Bracket orders</th>
                <th className={cn(TH, NUM)}>Sent sizes back</th>
                <th className={cn(TH, NUM)}>Units returned</th>
                <th className={cn(TH, NUM)}>Refunded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.customerId} className="border-b border-border last:border-0">
                  <td className={cn(TD, "font-medium")}>{c.name}</td>
                  <td className={cn(TD, NUM)}>{c.orders === null ? "—" : formatNumber(c.orders)}</td>
                  <td className={cn(TD, NUM)}>{formatNumber(c.bracketOrders)}</td>
                  <td className={cn(TD, NUM)}>{formatNumber(c.bracketReturns)}</td>
                  <td className={cn(TD, NUM)}>{pctText(c.returnRate, 0)}</td>
                  <td className={cn(TD, NUM, "font-semibold")}>{c.refunded === null ? "—" : formatCurrency(c.refunded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        A pattern in the store&apos;s own orders and refunds, not a verdict: a refund can be an exchange, a fault or a fit
        problem. Nothing is sent to these customers or flagged in Shopify.
      </p>
    </Card>
  );
}
