"use client";

import { useState } from "react";
import Link from "next/link";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { TrendChart } from "@/features/finance/charts";
import { AgingSkeleton } from "@/features/finance/finance-skeleton";
import { AGING_TONE, EmptyLine, NUM, Section, ShareBar, TD, TH } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { compactMoney, financeHref, financeVendorHref, EMPTY_FILTERS } from "@/lib/finance";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import type { AgingKey, AgingReport, AgingRow } from "@/types/finance";
import { currencySymbol, formatPercent } from "@/utils/format";

/**
 * Aging (SPEC-301): the company × age grid QuickBooks can't draw — each company only
 * knows its own books — plus who the money is owed to, the trend from the daily
 * snapshots, and the vendor × age grid. Every cell is a link to exactly those bills.
 */
export function AgingTab() {
  const aging = useApiQuery(financeQueries.aging());
  if (aging.isError) return <QueryErrorState error={aging.error} onRetry={() => void aging.refetch()} />;
  if (!aging.data) return <AgingSkeleton />;
  const report = aging.data;
  if (!report.live && report.total.total === 0) {
    return (
      <Section title="Aging">
        <EmptyLine>Nothing connected yet — connect a QuickBooks company to see what it owes.</EmptyLine>
      </Section>
    );
  }
  return (
    <div className="space-y-3">
      <CompanyGrid report={report} />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <Concentration report={report} />
        <Section title="Owed and late · last 8 weeks" meta="from the daily snapshots">
          <TrendChart points={report.trend} />
        </Section>
      </div>
      <VendorGrid report={report} />
    </div>
  );
}

function heat(amount: number, max: number, key: AgingKey): string {
  if (amount <= 0) return "";
  return amount / max > 0.5 ? AGING_TONE[key].strong : AGING_TONE[key].cell;
}

function CompanyGrid({ report }: { report: AgingReport }) {
  const max = Math.max(1, ...report.companies.flatMap((c) => report.bands.map((b) => c.buckets[b.key])));
  const row = (r: AgingRow, total: boolean) => (
    <tr key={r.company} className={cn("border-b border-border last:border-0", total && "border-t border-border font-bold")}>
      <th scope="row" className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">{r.company}</th>
      {report.bands.map((b) => {
        const amount = r.buckets[b.key];
        const filters = { ...EMPTY_FILTERS, age: b.key, ...(total ? {} : { company: r.company }) };
        return (
          <td key={b.key} className={cn("p-0", !total && heat(amount, max, b.key))}>
            {amount > 0 ? (
              <ShallowLink
                href={financeHref("bills", filters)}
                className={cn("block px-3 py-2 text-right text-sm tabular-nums outline-none hover:underline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", b.key !== "current" && "font-semibold")}
              >
                {compactMoney(amount)}
              </ShallowLink>
            ) : (
              <span className="block px-3 py-2 text-right text-sm text-muted-foreground">—</span>
            )}
          </td>
        );
      })}
      <td className={cn(TD, NUM, "text-sm font-bold")}>{compactMoney(r.total)}</td>
      <td className={cn(TD, NUM, "text-sm", r.pastDueShare > 0.4 && "font-semibold text-destructive")}>
        {formatPercent(r.pastDueShare * 100)}
      </td>
    </tr>
  );
  return (
    <Section title="Aging by company" meta="click any figure to open those bills">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className={cn(TH, "text-left")}>Company</th>
              {report.bands.map((b) => (
                <th key={b.key} className={cn(TH, "text-right")}>{b.label}</th>
              ))}
              <th className={cn(TH, "text-right")}>Total</th>
              <th className={cn(TH, "text-right")}>Past-due share</th>
            </tr>
          </thead>
          <tbody>
            {report.companies.map((c) => row(c, false))}
            {row({ ...report.total, company: "All companies" }, true)}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Concentration({ report }: { report: AgingReport }) {
  const [mode, setMode] = useState<"pct" | "usd">("pct");
  const rows = [
    ...report.concentration.map((c) => ({ ...c, other: false })),
    ...(report.other.count > 0
      ? [{ vendor: `All other · ${report.other.count}`, key: "", owed: report.other.owed, share: report.other.share, other: true }]
      : []),
  ];
  return (
    <Section
      title="Who we owe"
      meta="vendor concentration"
      actions={
        <span className="inline-flex overflow-hidden rounded-[10px] border border-border" role="group" aria-label="Show as">
          {(["pct", "usd"] as const).map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("px-2.5 py-0.5 text-xs font-semibold", i > 0 && "border-l border-border", mode === m ? "bg-muted" : "text-muted-foreground")}
            >
              {m === "pct" ? "%" : currencySymbol()}
            </button>
          ))}
        </span>
      }
    >
      <ul className="space-y-2.5 p-3">
        {rows.map((r) => {
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold">{r.vendor}</span>
                <span className="text-sm font-bold tabular-nums">
                  {mode === "pct" ? formatPercent(r.share * 100) : compactMoney(r.owed)}
                </span>
              </span>
              <ShareBar className="mt-1" parts={[[r.share * 100, r.other ? "bg-muted-foreground/50" : "bg-foreground"]]} />
            </>
          );
          return (
            <li key={r.vendor}>
              {r.other ? (
                <div>{body}</div>
              ) : (
                <Link prefetch={false} href={financeVendorHref(r.key)} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No vendor is owed anything.</li>}
      </ul>
    </Section>
  );
}

function VendorGrid({ report }: { report: AgingReport }) {
  if (!report.vendors.length) return null;
  return (
    <Section title="Aging by vendor" meta={`the ${report.vendors.length} owed the most`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className={cn(TH, "text-left")}>Vendor</th>
              {report.bands.map((b) => (
                <th key={b.key} className={cn(TH, "text-right")}>{b.label}</th>
              ))}
              <th className={cn(TH, "text-right")}>Total</th>
            </tr>
          </thead>
          <tbody>
            {report.vendors.map((v) => (
              <tr key={v.key} className="border-b border-border last:border-0">
                <th scope="row" className="max-w-[16rem] px-3 py-2 text-left">
                  <Link prefetch={false} href={financeVendorHref(v.key)} className="block truncate text-sm font-semibold hover:underline">{v.vendor}</Link>
                </th>
                {report.bands.map((b) => (
                  <td key={b.key} className="p-0">
                    {v.buckets[b.key] > 0 ? (
                      <ShallowLink
                        href={financeHref("bills", { ...EMPTY_FILTERS, vendor: v.vendor, age: b.key })}
                        className={cn("block px-3 py-2 text-right text-sm tabular-nums hover:underline", b.key !== "current" && AGING_TONE[b.key].text)}
                      >
                        {compactMoney(v.buckets[b.key])}
                      </ShallowLink>
                    ) : (
                      <span className="block px-3 py-2 text-right text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
                <td className={cn(TD, NUM, "text-sm font-bold")}>{compactMoney(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
