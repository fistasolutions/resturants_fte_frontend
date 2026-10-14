"use client";

import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { ValueSkeleton } from "@/features/finance/finance-skeleton";
import { Tile } from "@/features/finance/finance-ui";
import { AssumptionsPanel, ExposurePanel } from "@/features/finance/value/assumptions-panel";
import { BaselinePanel } from "@/features/finance/value/baseline-panel";
import { useValueActions } from "@/features/finance/value/use-value-actions";
import { ValueLedger } from "@/features/finance/value/value-ledger";
import { useApiQuery } from "@/hooks/use-api-query";
import { EMPTY_FILTERS, compactMoney, financeHref, shortDate } from "@/lib/finance";
import {
  monthLabel,
  normalizeLedgerFilter,
  normalizeMonth,
  statementLine,
  valueHref,
} from "@/lib/finance-value";
import { financeQueries } from "@/lib/queries/finance";
import { teamQueries } from "@/lib/queries/team";
import { can } from "@/lib/team";
import { cn } from "@/lib/utils";
import type { FinanceValue, ValueGain } from "@/types/finance";

/**
 * Value (SPEC-330 / backend SPEC-338): what Finance Oversight was worth this month, and the
 * ledger that proves it. Money kept is read from the books — a bill paid inside its
 * discount window, a second copy deleted before anyone paid it. Time and timing are
 * estimates on the store's own stated assumptions, and are labelled so everywhere.
 */
export function ValueTab() {
  const params = useSearchParams();
  const requested = normalizeMonth(params.get("month"));
  const filter = normalizeLedgerFilter(params.get("view"));
  const value = useApiQuery(financeQueries.value(requested));
  const access = useApiQuery(teamQueries.access());
  const actions = useValueActions();

  if (value.isError) return <QueryErrorState error={value.error} onRetry={() => void value.refetch()} />;
  if (!value.data) return <ValueSkeleton />;
  const v = value.data;
  const current = v.month === v.months[0];
  const editable = !v.sample && (access.data ? can(access.data, "finance.manage") : false);

  return (
    <div className="space-y-3">
      {v.sample && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-foreground">Sample company.</span> No QuickBooks company is connected, so
            every figure on this tab is a sample business. Connect QuickBooks on the Overview to see your own.
          </span>
        </p>
      )}

      <Statement value={v} current={current} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="Discounts kept"
          value={compactMoney(v.measured.discountsKept.amount)}
          tone={v.measured.discountsKept.amount > 0 ? "good" : null}
          sub={`${v.measured.discountsKept.count} bills · from your books`}
          href={valueHref(requested, "kept")}
        />
        <Tile
          label="Duplicates stopped"
          value={compactMoney(v.measured.duplicatesStopped.amount)}
          tone={v.measured.duplicatesStopped.amount > 0 ? "good" : null}
          sub={`${v.measured.duplicatesStopped.count} bills · from your books`}
          href={valueHref(requested, "kept")}
        />
        <Tile
          label="Lost"
          value={compactMoney(v.lost.discountsMissed.amount + v.lost.paidTwice.amount)}
          tone={v.lost.discountsMissed.amount + v.lost.paidTwice.amount > 0 ? "bad" : null}
          sub={`${v.lost.discountsMissed.count} missed · ${v.lost.paidTwice.count} paid twice`}
          href={valueHref(requested, "lost")}
        />
        <Tile
          label="Review time"
          value={compactMoney(v.estimated.time.amount)}
          sub={`${v.estimated.time.hours.toFixed(1)} h · estimated`}
        />
        <GainTile label="Paying on time" gain={v.estimated.timing} />
        <GainTile label="Late fees" gain={v.estimated.lateFees} />
      </div>

      <AtStake value={v} />

      <ValueLedger
        rows={v.ledger}
        filter={filter}
        month={requested}
        editable={editable}
        pending={actions.pending}
        onDismiss={actions.dismiss}
        onRestore={actions.restore}
      />
      {actions.error && (
        <p role="alert" className="text-xs text-destructive">
          {actions.error}
        </p>
      )}

      <BaselinePanel baseline={v.baseline} />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <AssumptionsPanel
          assumptions={v.assumptions}
          editable={editable}
          saving={actions.pending === "assumptions"}
          onSave={actions.saveAssumptions}
        />
        <ExposurePanel exposure={v.exposure} />
      </div>
    </div>
  );
}

function Statement({ value, current }: { value: FinanceValue; current: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{statementLine(value, current)}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          Since {value.connectedSince ? shortDate(value.connectedSince) : "connecting"}:{" "}
          <span className="font-semibold text-foreground">{compactMoney(value.sinceConnected.measured)}</span> kept
        </span>
        <MonthPicker months={value.months} month={value.month} />
      </div>
    </div>
  );
}

function MonthPicker({ months, month }: { months: string[]; month: string }) {
  if (months.length < 2) return null;
  return (
    <nav aria-label="Month" className="flex flex-wrap gap-1">
      {months.slice(0, 6).map((m, index) => (
        <ShallowLink
          key={m}
          href={valueHref(index === 0 ? null : m)}
          aria-current={m === month ? "page" : undefined}
          className={cn(
            "rounded-full border border-border px-2 py-0.5 font-semibold transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            m === month && "border-foreground text-foreground",
          )}
        >
          {index === 0 ? "This month" : monthLabel(m).split(" ")[0].slice(0, 3)}
        </ShallowLink>
      ))}
    </nav>
  );
}

function GainTile({ label, gain }: { label: string; gain: ValueGain | null }) {
  if (!gain) return <Tile label={label} value="—" sub="Nothing to compare yet · estimated" />;
  return (
    <Tile
      label={label}
      value={`${gain.amount >= 0 ? "" : "−"}${compactMoney(Math.abs(gain.amount))}`}
      tone={gain.amount > 0 ? "good" : gain.amount < 0 ? "warn" : null}
      sub={`vs ${compactMoney(gain.before)} at last year's habit · estimated`}
    />
  );
}

function AtStake({ value }: { value: FinanceValue }) {
  const s = value.atStake;
  const nothing = s.discounts.count === 0 && s.duplicates.count === 0 && s.lateFees.count === 0;
  if (nothing) return null;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Tile
        label="At stake · discounts"
        value={compactMoney(s.discounts.amount)}
        tone={s.discounts.count ? "warn" : null}
        sub={
          s.discounts.count
            ? `${s.discounts.count} open${s.discounts.soonest ? ` · first closes ${shortDate(s.discounts.soonest)}` : ""}`
            : "None open"
        }
        href={value.sample ? undefined : financeHref("bills", { ...EMPTY_FILTERS, watch: true })}
      />
      <Tile
        label="At stake · duplicates"
        value={compactMoney(s.duplicates.amount)}
        tone={s.duplicates.count ? "bad" : null}
        sub={s.duplicates.count ? `${s.duplicates.count} not paid yet` : "None open"}
        href={value.sample ? undefined : valueHref(null, "open")}
      />
      <Tile
        label="Late fees accruing"
        value={compactMoney(s.lateFees.amount)}
        tone={s.lateFees.count ? "warn" : null}
        sub={s.lateFees.count ? `${s.lateFees.count} bills past due · estimated` : "Nothing past due"}
        href={value.sample ? undefined : financeHref("bills", { ...EMPTY_FILTERS, window: "past" })}
      />
    </div>
  );
}
