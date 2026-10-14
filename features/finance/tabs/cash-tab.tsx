"use client";

import { useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { CashChart } from "@/features/finance/charts";
import { CashSkeleton } from "@/features/finance/finance-skeleton";
import { LABEL, NUM, Section, TD, TH, Tile } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { compactMoney, financeHref, EMPTY_FILTERS, shortDate } from "@/lib/finance";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

/**
 * Cash (SPEC-301): the next 13 weeks, built from what we can actually read — QuickBooks
 * bank balances, the store's own takings (from Shopify, which no A/P tool has), and the
 * bills by due date. It names what it leaves out rather than pretending to be a forecast
 * of the whole business.
 */
export function CashTab() {
  const params = useSearchParams();
  const company = params.get("company") || "all";
  const cash = useApiQuery(financeQueries.cash(company), { placeholderData: keepPreviousData });

  if (cash.isError) return <QueryErrorState error={cash.error} onRetry={() => void cash.refetch()} />;
  if (!cash.data) return <CashSkeleton />;
  const data = cash.data;
  const week0 = data.weeks[0];
  const unknownTakings = Object.entries(data.takingsByCompany).filter(([, v]) => v === null).map(([c]) => c);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={LABEL}>Company</span>
        <div className="inline-flex flex-wrap overflow-hidden rounded-[10px] border border-border bg-card" role="group" aria-label="Company">
          {["all", ...data.companies].map((c, i) => (
            <ShallowLink
              key={c}
              href={financeHref("cash", EMPTY_FILTERS, { company: c === "all" ? null : c })}
              aria-current={data.company === c ? "true" : undefined}
              className={cn(
                "px-3 py-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                i > 0 && "border-l border-border",
                data.company === c ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "all" ? "All companies" : c}
            </ShallowLink>
          ))}
        </div>
        {cash.isFetching && <span className="text-xs text-muted-foreground">refreshing</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tile label="Cash in QuickBooks" value={compactMoney(data.bank)} sub={`${data.bankAccounts.length} bank ${data.bankAccounts.length === 1 ? "account" : "accounts"} · book balance`} />
        <Tile label="Bills due this week" value={compactMoney(week0?.billsDue ?? 0)} sub="late + next 7 days" tone={(week0?.billsDue ?? 0) > 0 ? "warn" : null} />
        <Tile label="Takings per week" value={compactMoney(data.takingsPerWeek)} sub="store sales · 8-week average" />
        <Tile
          label="Lowest week"
          value={compactMoney(data.lowest.balance)}
          sub={`week of ${shortDate(data.lowest.start)} · cushion ${compactMoney(data.cushion)}`}
          tone={data.lowest.balance < 0 ? "bad" : data.lowest.balance < data.cushion ? "warn" : "good"}
        />
      </div>

      <Section title="Next 13 weeks" meta="bank + takings − bills due">
        <CashChart weeks={data.weeks} bank={data.bank} cushion={data.cushion} />
      </Section>

      <Section title="By week">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={cn(TH, "text-left")}>Week of</th>
                <th className={cn(TH, "text-right")}>Takings</th>
                <th className={cn(TH, "text-right")}>Bills due</th>
                <th className={cn(TH, "text-right")}>Bills</th>
                <th className={cn(TH, "text-right")}>Cash at week end</th>
                <th className={cn(TH, "text-left")}><span className="sr-only">State</span></th>
              </tr>
            </thead>
            <tbody>
              {data.weeks.map((w) => (
                <tr key={w.week} className="border-b border-border last:border-0">
                  <td className={cn(TD, "text-sm")}>
                    {shortDate(w.start)}
                    {w.lateIncluded && <span className="ml-1.5"><StatusBadge tone="destructive">incl. late</StatusBadge></span>}
                  </td>
                  <td className={cn(TD, NUM, "text-sm text-success")}>+{compactMoney(w.takings)}</td>
                  <td className={cn(TD, NUM, "text-sm", w.billsDue === 0 && "text-muted-foreground")}>{w.billsDue === 0 ? "—" : `−${compactMoney(w.billsDue)}`}</td>
                  <td className={cn(TD, NUM, "text-sm text-muted-foreground")}>{w.bills}</td>
                  <td className={cn(TD, NUM, "text-sm font-semibold", w.belowCushion && "text-destructive")}>{formatCurrency(w.balance)}</td>
                  <td className={TD}>
                    {w.overdrawn ? <StatusBadge tone="destructive">Overdrawn</StatusBadge> : w.belowCushion ? <StatusBadge tone="warning">Below cushion</StatusBadge> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ul className="space-y-1 text-xs text-muted-foreground">
        {data.excludes.map((line) => (
          <li key={line}>Not included: {line.charAt(0).toLowerCase() + line.slice(1)}. The real line sits lower.</li>
        ))}
        {unknownTakings.length > 0 && (
          <li>No store location matches {unknownTakings.join(", ")}, so no takings are counted for {unknownTakings.length === 1 ? "it" : "them"}.</li>
        )}
      </ul>
    </div>
  );
}
