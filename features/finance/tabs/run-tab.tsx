"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Copy } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { RunSkeleton } from "@/features/finance/finance-skeleton";
import {
  EmptyLine,
  FlagChips,
  LABEL,
  NUM,
  Section,
  ShareBar,
  SUB,
  TD,
  TH,
  VALUE,
  VerdictChip,
} from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  compactMoney,
  financeBillHref,
  financeHref,
  EMPTY_FILTERS,
  normalizeThrough,
  RUN_THROUGH,
  shortDate,
} from "@/lib/finance";
import { cashAfter, defaultPicks, reasonLabel, runCompanies, runText, runTotal, toggled } from "@/lib/finance-run";
import { financeQueries } from "@/lib/queries/finance";
import { cn } from "@/lib/utils";
import type { RunPlan } from "@/types/finance";
import { formatCurrency } from "@/utils/format";

const REASON_TONE: Record<string, StatusTone> = { bad: "destructive", good: "success", warn: "warning", neutral: "neutral" };

/**
 * Payment run (SPEC-301 / backend SPEC-295): a cash requirements report as the week's
 * proposal. The backend picks and orders the bills — late first, then discounts that
 * close before the next run, then what is due — and holds back a second copy of a
 * duplicate. The ticks are the owner's: each one moves that company's "cash after" in
 * place, with no request. It is a plan; paying happens in QuickBooks.
 */
export function RunTab() {
  const params = useSearchParams();
  const through = normalizeThrough(params.get("through"));
  const run = useApiQuery(financeQueries.run(through), { placeholderData: keepPreviousData });

  if (run.isError) return <QueryErrorState error={run.error} onRetry={() => void run.refetch()} />;
  if (!run.data) return <RunSkeleton />;
  // The ticks belong to one plan: a new cut-off is a new plan, so it starts fresh.
  return <RunBody key={`${run.data.through}-${run.data.rows.length}`} plan={run.data} refreshing={run.isFetching} />;
}

function RunBody({ plan, refreshing }: { plan: RunPlan; refreshing: boolean }) {
  const [picks, setPicks] = useState(() => defaultPicks(plan));
  const [copied, setCopied] = useState<string | null>(null);
  const companies = useMemo(() => runCompanies(plan, picks), [plan, picks]);
  const after = useMemo(() => cashAfter(plan, picks), [plan, picks]);
  const total = runTotal(plan, picks);
  const held = plan.rows.length - total.bills;

  async function copy() {
    try {
      await navigator.clipboard.writeText(runText(plan, picks));
      setCopied("Copied — paste it wherever you pay from.");
    } catch {
      setCopied("Copying isn't allowed here — select the table instead.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={LABEL}>Pay through</span>
        <div className="inline-flex overflow-hidden rounded-[10px] border border-border bg-card" role="group" aria-label="Pay through">
          {RUN_THROUGH.map((option, i) => (
            <ShallowLink
              key={option.key}
              href={financeHref("run", EMPTY_FILTERS, { through: option.key === "week" ? null : option.key })}
              aria-current={plan.through === option.key ? "true" : undefined}
              className={cn(
                "px-3 py-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                i > 0 && "border-l border-border",
                plan.through === option.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </ShallowLink>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          through {shortDate(plan.throughDate)}
          {refreshing ? " · refreshing" : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
          <span className={cn(LABEL, "block")}>This run</span>
          <span className={cn(VALUE, "block")}>{formatCurrency(total.amount)}</span>
          <span className={SUB}>
            {total.bills} {total.bills === 1 ? "bill" : "bills"}
            {held ? ` · ${held} held back` : ""}
          </span>
        </div>
        {companies.map((c) => (
          <div key={c.company} className="min-w-0 space-y-1 rounded-xl border border-border bg-card px-3 py-2">
            <span className={cn(LABEL, "block")}>{c.company}</span>
            <span className={cn(VALUE, "block", c.verdict === "short" && "text-destructive")}>
              {compactMoney(c.need)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                to pay · {c.bank === null ? "no bank account read" : `${compactMoney(c.bank)} in the bank`}
              </span>
            </span>
            <ShareBar
              parts={[
                [
                  c.bank ? (c.need / c.bank) * 100 : 0,
                  c.verdict === "short" ? "bg-destructive" : c.verdict === "tight" ? "bg-warning" : "bg-success",
                ],
              ]}
            />
            <VerdictChip verdict={c.verdict} left={c.left} />
          </div>
        ))}
      </div>

      <Section
        title="Bills in this run"
        meta="in the order to pay · untick to hold one back"
        actions={
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void copy()} disabled={total.bills === 0}>
            <Copy className="size-3.5" aria-hidden />
            Copy list
          </Button>
        }
      >
        {copied && <p role="status" className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">{copied}</p>}
        {plan.rows.length === 0 ? (
          <EmptyLine>{plan.live ? "Nothing is late or due by then — no run needed." : "Nothing connected yet."}</EmptyLine>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse">
              <thead>
                <tr>
                  <th className={cn(TH, "w-10 text-left")}><span className="sr-only">Include</span></th>
                  <th className={cn(TH, "w-10 text-right")}>#</th>
                  <th className={cn(TH, "text-left")}>Vendor</th>
                  <th className={cn(TH, "text-left")}>Company</th>
                  <th className={cn(TH, "text-left")}>Bill no.</th>
                  <th className={cn(TH, "text-left")}>Why now</th>
                  <th className={cn(TH, "text-right")}>Balance</th>
                  <th className={cn(TH, "text-right")}>Company cash after</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((row, i) => {
                  const on = picks.has(row.bill.id);
                  const cash = after.get(row.bill.id);
                  const reason = reasonLabel(row);
                  return (
                    <tr key={row.bill.id} className={cn("border-b border-border last:border-0", !on && "text-muted-foreground")}>
                      <td className={TD}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setPicks((p) => toggled(p, row.bill.id))}
                          aria-label={`Include ${row.bill.vendor} ${row.bill.number}`}
                          className="size-4 accent-foreground"
                        />
                      </td>
                      <td className={cn(TD, NUM, "text-xs")}>{i + 1}</td>
                      <td className="max-w-[16rem] px-3 py-2">
                        <Link prefetch={false} href={financeBillHref(row.bill)} className="block truncate text-sm font-semibold hover:underline">
                          {row.bill.vendor}
                        </Link>
                        {row.heldReason && <span className="block text-[11px] text-destructive">{row.heldReason}</span>}
                      </td>
                      <td className={TD}><StatusBadge tone="neutral">{row.bill.company}</StatusBadge></td>
                      <td className={cn(TD, "font-mono text-xs")}>{row.bill.number}</td>
                      <td className={TD}>
                        <span className="flex flex-wrap items-center gap-1">
                          <StatusBadge tone={REASON_TONE[reason.tone]}>{reason.text}</StatusBadge>
                          <FlagChips flags={row.bill.flags.filter((f) => f.kind === "duplicate")} amount={row.bill.amount} />
                        </span>
                      </td>
                      <td className={cn(TD, NUM, "text-sm font-semibold")}>{formatCurrency(row.bill.balance)}</td>
                      <td className={cn(TD, NUM, "text-sm", cash !== null && cash !== undefined && cash < 0 && "font-semibold text-destructive")}>
                        {cash === null || cash === undefined ? (on ? "—" : "held") : formatCurrency(cash)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold">Total · {total.bills} ticked</td>
                  <td className={cn(TD, NUM, "text-xs font-bold")}>{formatCurrency(total.amount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>
      <p className="text-xs text-muted-foreground">
        A plan, not a payment. Pay in QuickBooks — paid bills leave this list on the next hourly read. Each company pays
        from its own account; nothing is netted across companies.
      </p>
    </div>
  );
}
