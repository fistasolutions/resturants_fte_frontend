"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { DisconnectAllDialog, DisconnectOneDialog } from "@/features/finance/disconnect-dialogs";
import { OverviewSkeleton } from "@/features/finance/finance-skeleton";
import {
  AGING_TONE,
  FlagChips,
  LABEL,
  Section,
  ShareBar,
  SUB,
  Tile,
  VALUE,
  VerdictChip,
} from "@/features/finance/finance-ui";
import { RateDialog } from "@/features/finance/rate-dialog";
import { useFinanceActions } from "@/features/finance/use-finance-actions";
import { QboSyncBar } from "@/features/integrations/qbo-sync-bar";
import { useQboConnections } from "@/features/integrations/use-qbo-connections";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  AGING,
  compactMoney,
  daysUntil,
  dueLabel,
  financeBillHref,
  financeHref,
  financeVendorHref,
  EMPTY_FILTERS,
} from "@/lib/finance";
import { rateLabel, reportingLine, waitingForRates } from "@/lib/finance-currency";
import { financeQueries } from "@/lib/queries/finance";
import { agoLabel } from "@/lib/trust-footer";
import { syncProgress } from "@/lib/quickbooks-connection";
import { cn } from "@/lib/utils";
import type {
  Bill,
  BillFilters,
  ConnectionsOverview,
  FinanceOverview,
  MorningNote,
  QboConnection,
} from "@/types/finance";
import { formatCurrency, formatNumber } from "@/utils/format";

const bills = (filters: Partial<BillFilters>): string =>
  financeHref("bills", { ...EMPTY_FILTERS, ...filters });

/**
 * Overview (SPEC-301): the morning read. What's owed, what's late, whether each company
 * can pay its week from its own account, and three queues organised by what needs
 * doing — Ramp's shape, with our queues derived from due dates and the backend's rules,
 * because QuickBooks has no approval or scheduling states to read.
 */
export function OverviewTab() {
  const ap = useApiQuery(financeQueries.ap(), { placeholderData: keepPreviousData });
  const connections = useQboConnections();
  const today = useMemo(() => new Date(), []);

  if (ap.isError) return <QueryErrorState error={ap.error} onRetry={() => void ap.refetch()} />;
  if (!ap.data) return <OverviewSkeleton />;
  const overview = ap.data;

  return (
    <div className="space-y-3">
      <ConnectionLine
        overview={overview}
        rooms={connections.data?.connections ?? []}
        info={connections.data ?? null}
        configured={connections.data?.configured !== false}
        refreshing={ap.isFetching}
      />
      {overview.note && <NoteCard note={overview.note} />}
      <MoneyStrip overview={overview} />
      <CompanyCards overview={overview} today={today} />
      <Queues overview={overview} today={today} />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AgingPanel overview={overview} />
        <SinceYesterday overview={overview} />
      </div>
    </div>
  );
}

function ConnectionLine({
  overview,
  rooms,
  info,
  configured,
  refreshing,
}: {
  overview: FinanceOverview;
  rooms: QboConnection[];
  info: ConnectionsOverview | null;
  configured: boolean;
  refreshing: boolean;
}) {
  const actions = useFinanceActions();
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [rateFor, setRateFor] = useState<{ currency: string; company: string } | null>(null);
  const reporting = info?.reportingCurrency ?? "";
  const currencyLine = info ? reportingLine(info) : null;
  const waiting = info ? waitingForRates(info) : [];
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
        <span className={LABEL}>QuickBooks</span>
        {rooms.length > 0 ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {rooms.map((room) => (
              <span key={room.id} className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", room.status === "connected" ? "bg-success" : "bg-destructive")} aria-hidden />
                <span className="font-medium">{room.companyName}</span>
                <span className="font-mono text-muted-foreground">{room.realmIdMasked}</span>
                {room.status !== "connected" && <StatusBadge tone="destructive">reconnect</StatusBadge>}
                <RoleGate need={["finance.manage", "integrations.manage"]}>
                  <button
                    type="button"
                    onClick={() => setConfirm({ id: room.id, name: room.companyName })}
                    aria-label={`Disconnect ${room.companyName}`}
                    className="rounded text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </RoleGate>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">No company connected — each of your QuickBooks companies connects once.</span>
        )}
        <span className="text-muted-foreground">
          {overview.live
            ? `${overview.syncedAt ? `read ${agoLabel(overview.syncedAt)}` : "first read running"} · reads hourly at :20${refreshing ? " · refreshing" : ""}`
            : null}
        </span>
        {!overview.live && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden />
            <b className="font-semibold text-foreground">Nothing connected</b> — connect a company to see what it owes
          </span>
        )}
        {configured && (
          <span className="ml-auto flex items-center gap-2">
            {rooms.length >= 2 && (
              <RoleButton need={["finance.manage", "integrations.manage"]} variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive" onClick={() => setConfirmAll(true)}>
                Disconnect all
              </RoleButton>
            )}
            <RoleButton need={["finance.manage", "integrations.manage"]} size="sm" className="h-7 px-2.5 text-xs" onClick={() => void actions.connect()} disabled={actions.connecting}>
              {actions.connecting ? "Opening QuickBooks…" : rooms.length ? "Connect another" : "Connect QuickBooks"}
            </RoleButton>
          </span>
        )}
        {currencyLine && rooms.length > 0 && (
          // SPEC-331 — what every figure is in, and the rate behind each other currency.
          <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">{currencyLine}</span>
            {(info?.rates ?? []).map((rate) => (
              <span key={`${rate.currency}-${rate.source}`} className="tabular-nums">
                {rateLabel(rate, reporting)}
              </span>
            ))}
          </span>
        )}
      </div>
      {waiting.map((row) => (
        <div
          key={row.company}
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-xs"
        >
          <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            <b className="font-semibold">{row.company}</b> keeps its books in {row.currencies.join(", ")} and QuickBooks has
            no rate into {reporting} — it is left out of every total until a rate is set.
          </span>
          <span className="ml-auto flex gap-2">
            {row.currencies.map((currency) => (
              <RoleButton
                key={currency}
                need="finance.manage"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setRateFor({ currency, company: row.company })}
              >
                Set {currency} rate
              </RoleButton>
            ))}
          </span>
        </div>
      ))}
      {rooms.some((room) => room.sync) && (
        // SPEC-303 — each company being read gets its own bar under the strip.
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const view = syncProgress(room);
            return view ? <QboSyncBar key={room.id} company={room.companyName} view={view} /> : null;
          })}
        </div>
      )}
      {actions.error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {actions.error}
        </p>
      )}
      <DisconnectOneDialog company={confirm} onClose={() => setConfirm(null)} onConfirm={(id) => void actions.disconnect(id)} />
      <DisconnectAllDialog
        open={confirmAll}
        companies={rooms.map((room) => room.companyName)}
        onClose={() => setConfirmAll(false)}
        onConfirm={actions.disconnectAll}
      />
      <RateDialog
        currency={rateFor?.currency ?? null}
        company={rateFor?.company ?? ""}
        reporting={reporting}
        onClose={() => setRateFor(null)}
        onSave={async (currency, rate) => {
          const saved = await actions.setRate(currency, rate);
          if (saved) actions.sync();
          return saved;
        }}
      />
    </>
  );
}

const NOTE_TONE: Record<MorningNote["tone"], string> = {
  bad: "border-destructive/35 bg-destructive/5",
  warn: "border-warning/40 bg-warning/5",
  good: "border-success/35 bg-success/5",
};

function NoteCard({ note }: { note: MorningNote }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-3 py-2.5", NOTE_TONE[note.tone])}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-[11px] font-extrabold text-background" aria-hidden>
        FO
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[11px] text-muted-foreground">Accounts Payable · this morning</p>
        <p className="text-sm leading-relaxed">
          <b className="font-semibold">{note.headline}</b> {note.body}
        </p>
        {note.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.actions.map((action) =>
              action.billId ? (
                <Button key={action.label} asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link prefetch={false} href={financeBillHref({ id: action.billId })}>{action.label}</Link>
                </Button>
              ) : (
                <Button key={action.label} asChild variant="outline" size="sm" className="h-7 text-xs">
                  <ShallowLink href={`/employees/finance${action.href ?? ""}`}>{action.label}</ShallowLink>
                </Button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MoneyStrip({ overview }: { overview: FinanceOverview }) {
  const t = overview.totals;
  const plural = (n: number) => `${formatNumber(n)} ${n === 1 ? "bill" : "bills"}`;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <Tile label="Total A/P" value={compactMoney(t.outstanding)} sub={`${plural(t.outstandingBills)} · ${overview.companies.length} companies`} href={bills({})} />
      <Tile label="Past due" value={compactMoney(t.pastDue)} sub={plural(t.pastDueBills)} tone={t.pastDue > 0 ? "bad" : null} href={bills({ window: "past" })} />
      <Tile label="Due · 7 days" value={compactMoney(t.due7)} sub={plural(t.due7Bills)} tone={t.due7 > 0 ? "warn" : null} href={bills({ window: "7" })} />
      <Tile label="Due · 30 days" value={compactMoney(t.due30)} sub={plural(t.due30Bills)} href={bills({ window: "30" })} />
      <Tile
        label="Cash in QuickBooks"
        value={t.bank === null ? "—" : compactMoney(t.bank)}
        sub={t.bank === null ? "no bank account read yet" : "book balance · all companies"}
        href={financeHref("cash")}
      />
      <Tile
        label="Left after this week"
        value={t.left7 === null ? "—" : compactMoney(t.left7)}
        sub="cash − late − due in 7 days"
        tone={t.left7 !== null && t.left7 < 0 ? "bad" : null}
        href={financeHref("run")}
      />
    </div>
  );
}

function CompanyCards({ overview, today }: { overview: FinanceOverview; today: Date }) {
  if (!overview.companyTotals.length) return null;
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {overview.companyTotals.map((c) => {
        const mine = overview.bills.filter((b) => b.company === c.company);
        const byAge = AGING.map((a) => ({
          key: a.key,
          amount: mine.filter((b) => {
            const d = daysUntil(b.dueOn, today);
            return d >= a.from && d <= a.to;
          }).reduce((t, b) => t + b.balance, 0),
        }));
        return (
          <ShallowLink
            key={c.company}
            href={bills({ company: c.company })}
            className="block min-w-0 space-y-1.5 rounded-xl border border-border bg-card px-3 py-2.5 outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2">
              <span className={LABEL}>{c.company}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{c.bills} bills</span>
              <span className="ml-auto">
                <VerdictChip verdict={c.verdict} left={c.left7} />
              </span>
            </span>
            <span className={cn(VALUE, "block")}>{formatCurrency(c.outstanding)}</span>
            <ShareBar parts={byAge.map((a) => [c.outstanding ? (a.amount / c.outstanding) * 100 : 0, AGING_TONE[a.key].bar])} />
            <span className="grid grid-cols-3 gap-2 pt-0.5">
              <Figure label={`past due · ${c.pastDueBills}`} value={compactMoney(c.pastDue)} tone={c.pastDue > 0 ? "text-destructive" : ""} />
              <Figure label="late + next 7d" value={compactMoney(c.need7)} />
              <Figure label="in the bank" value={c.bank === null ? "—" : compactMoney(c.bank)} />
            </span>
          </ShallowLink>
        );
      })}
    </div>
  );
}

function Figure({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <span className="min-w-0">
      <b className={cn("block truncate text-sm tabular-nums", tone)}>{value}</b>
      <span className={SUB}>{label}</span>
    </span>
  );
}

function Queues({ overview, today }: { overview: FinanceOverview; today: Date }) {
  const late = overview.bills
    .filter((b) => daysUntil(b.dueOn, today) < 0)
    .sort((a, b) => daysUntil(a.dueOn, today) - daysUntil(b.dueOn, today) || b.balance - a.balance);
  const week = overview.bills
    .filter((b) => {
      const d = daysUntil(b.dueOn, today);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const flagged = overview.bills
    .filter((b) => b.flags.length > 0)
    .sort((a, b) => rank(a) - rank(b) || b.balance - a.balance);
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
      <Queue title="Pay now" dot="bg-destructive" list={late} foot={`All ${late.length} late bills`} href={bills({ window: "past" })} today={today} />
      <Queue title="Due this week" dot="bg-warning" list={week} foot={`All ${week.length} due this week`} href={bills({ window: "7" })} today={today} />
      <Queue title="Needs a look" dot="bg-ai" list={flagged} foot="All flagged bills" href={bills({ watch: true })} today={today} flags note="rules, not AI" />
    </div>
  );
}

/** Duplicates first, then unusual amounts, new vendors, open discounts. */
function rank(bill: Bill): number {
  const order = ["duplicate", "unusual", "new_vendor", "discount"];
  return Math.min(...bill.flags.map((f) => order.indexOf(f.kind)));
}

function Queue({
  title,
  dot,
  list,
  foot,
  href,
  today,
  flags = false,
  note,
}: {
  title: string;
  dot: string;
  list: Bill[];
  foot: string;
  href: string;
  today: Date;
  flags?: boolean;
  note?: string;
}) {
  const total = list.reduce((t, b) => t + b.balance, 0);
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className={cn("size-2 rounded-full", dot)} aria-hidden />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{list.length}</span>
        <span className="ml-auto text-sm font-bold tabular-nums">{note ? <span className="text-[11px] font-medium text-muted-foreground">{note}</span> : compactMoney(total)}</span>
      </div>
      <ul className="flex-1">
        {list.slice(0, 5).map((bill) => {
          const d = daysUntil(bill.dueOn, today);
          return (
            <li key={bill.id} className="border-b border-border last:border-0">
              <Link prefetch={false} href={financeBillHref(bill)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-3 py-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50">
                <span className="truncate text-sm font-semibold">{bill.vendor}</span>
                <span className="text-right text-sm font-semibold tabular-nums">{formatCurrency(bill.balance)}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {bill.company} · {bill.number}
                </span>
                <span className={cn("text-right text-[11px]", d < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {dueLabel(bill, today)}
                </span>
                {/* Chips get a row of their own so they never squeeze the vendor's name. */}
                {flags && (
                  <span className="col-span-2 mt-1">
                    <FlagChips flags={bill.flags} amount={bill.amount} />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-3 py-8 text-center text-xs text-muted-foreground">Nothing here.</li>}
      </ul>
      <ShallowLink href={href} className="border-t border-border px-3 py-2 text-center text-xs font-semibold outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50">
        {foot} →
      </ShallowLink>
    </section>
  );
}

function AgingPanel({ overview }: { overview: FinanceOverview }) {
  const max = Math.max(1, ...overview.aging.map((a) => a.amount));
  return (
    <Section title="Aging · every company" meta="by due date" actions={<Button asChild variant="outline" size="sm" className="h-7 text-xs"><ShallowLink href={financeHref("aging")}>Open Aging</ShallowLink></Button>}>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-5">
        {overview.aging.map((bucket) => (
          <Tile
            key={bucket.key}
            label={bucket.label}
            value={compactMoney(bucket.amount)}
            sub={`${bucket.bills} ${bucket.bills === 1 ? "bill" : "bills"}`}
            href={bills({ age: bucket.key })}
          >
            <ShareBar className="my-1" parts={[[(bucket.amount / max) * 100, AGING_TONE[bucket.key].bar]]} />
          </Tile>
        ))}
      </div>
    </Section>
  );
}

function SinceYesterday({ overview }: { overview: FinanceOverview }) {
  const c = overview.changes;
  const rows: { label: string; value: string; sub: string; tone?: string; href?: string }[] = [
    { label: "New bills", value: `${c.newBills.count} · ${compactMoney(c.newBills.amount)}`, sub: "entered in QuickBooks in the last 2 days" },
    { label: "Went late", value: `${c.wentLate.count} · ${compactMoney(c.wentLate.amount)}`, sub: "crossed their due date in the last 2 days", tone: c.wentLate.count ? "text-destructive" : "" },
    { label: "Paid in QuickBooks", value: `${c.paid.count} · ${compactMoney(c.paid.amount)}`, sub: "payments dated since yesterday" },
  ];
  return (
    <Section title="Since yesterday" meta="what moved in the books">
      <ul>
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-border px-3 py-2 last:border-0">
            <b className="text-sm">{row.label}</b>
            <b className={cn("text-right text-sm tabular-nums", row.tone)}>{row.value}</b>
            <span className={SUB}>{row.sub}</span>
          </li>
        ))}
        {c.topVendor && (
          <li className="border-t border-border">
            <Link prefetch={false} href={financeVendorHref(c.topVendor.key)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-3 py-2 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50">
              <b className="text-sm">Largest vendor exposure</b>
              <b className="text-right text-sm">{c.topVendor.vendor}</b>
              <span className={SUB}>{Math.round(c.topVendor.share * 100)}% of everything owed</span>
            </Link>
          </li>
        )}
      </ul>
    </Section>
  );
}
