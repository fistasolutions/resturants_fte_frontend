"use client";

import Link from "next/link";
import { Check, CircleArrowRight, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProfileSkeleton } from "@/features/finance/finance-skeleton";
import { EmptyLine, Section, Tile } from "@/features/finance/finance-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { financeQueries } from "@/lib/queries/finance";
import { agoLabel } from "@/lib/trust-footer";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";
import { compactMoney } from "@/lib/finance";

const DOES = [
  "Reads every open bill, paid bill, payment, vendor and bank balance, hourly at :20",
  "Flags possible duplicates, unusual amounts, new vendors and open discounts",
  "Proposes the week's payment run, in the order to pay",
];
const BRINGS = [
  "A company that can't cover its week from its own account",
  "A bill that looks like a second copy of another",
  "An early-pay discount about to close",
];
const NEVER = [
  "Pays, schedules, approves, edits or deletes anything in QuickBooks",
  "Contacts a vendor",
  "Moves money between companies",
];

/**
 * Profile (SPEC-301): why this is an employee and not a report — a job, a shift, what it
 * may do on its own, what it must bring to you, what it may never do, and a scorecard of
 * how the payables have actually been run (backend SPEC-295, from a year of paid bills).
 */
export function ProfileTab() {
  const profile = useApiQuery(financeQueries.profile());
  if (profile.isError) return <QueryErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  if (!profile.data) return <ProfileSkeleton />;
  const p = profile.data;
  const card = p.scorecard;

  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <Section title="Job description">
          <div className="space-y-3 p-3">
            <p className="max-w-prose text-[15px] leading-relaxed">
              Watches what your QuickBooks companies owe, and tells you before a bill goes late, before a week
              runs short, and before the same bill gets paid twice.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Tile label="Reports to" value="The owner" sub="Office of the Owner" />
              <Tile label="Shift" value="Hourly at :20" sub={p.lastRead ? `last read ${agoLabel(p.lastRead)}` : "not started yet"} />
              <Tile label="Books" value={`${p.books.length} ${p.books.length === 1 ? "company" : "companies"}`} sub="QuickBooks Online" />
            </div>
          </div>
        </Section>

        <Section title="Authority" meta="what it may do on its own">
          <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-3">
            <Ladder title="Does on its own" tone="success" icon={<Check className="size-3.5 text-success" aria-hidden />} items={DOES} />
            <Ladder title="Brings to you" tone="warning" icon={<CircleArrowRight className="size-3.5 text-warning" aria-hidden />} items={BRINGS} />
            <Ladder title="Never" tone="destructive" icon={<X className="size-3.5 text-destructive" aria-hidden />} items={NEVER} />
          </div>
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Intuit has no read-only permission, so the &ldquo;never&rdquo; column is enforced in the code — a test fails the build if a
            write to QuickBooks ever appears.
          </p>
        </Section>
      </div>

      <div className="space-y-3">
        <Section title="Scorecard" meta="last 12 months of paid bills">
          {card.paid.count === 0 ? (
            <EmptyLine>{p.live ? "No paid bills in the last year to score yet." : "Nothing connected yet."}</EmptyLine>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-3">
              <Tile
                label="Paid on time"
                value={card.onTimeRate === null ? "—" : formatPercent(card.onTimeRate * 100)}
                sub={`of ${card.measuredBills} bills with a payment date`}
                tone={card.onTimeRate !== null && card.onTimeRate < 0.8 ? "warn" : "good"}
              />
              <Tile label="Days to pay" value={card.avgDaysToPay === null ? "—" : `${card.avgDaysToPay} days`} sub="bill date → payment" />
              <Tile
                label="Discounts taken"
                value={`${card.discounts.taken} of ${card.discounts.offered}`}
                sub={`${compactMoney(card.discounts.saved)} kept · ${compactMoney(card.discounts.missed)} missed`}
                tone={card.discounts.missed > 0 ? "warn" : null}
              />
              <Tile label="Paid this year" value={compactMoney(card.paid.amount)} sub={`${card.paid.count} bills`} />
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">Open right now:</span>
            <StatusBadge tone="destructive">{card.openFlags.duplicate} possible duplicate{card.openFlags.duplicate === 1 ? "" : "s"}</StatusBadge>
            <StatusBadge tone="warning">{card.openFlags.unusual} unusual</StatusBadge>
            <StatusBadge tone="ai">{card.openFlags.newVendor} new vendor{card.openFlags.newVendor === 1 ? "" : "s"}</StatusBadge>
            <StatusBadge tone="success">{card.openFlags.discount} open discount{card.openFlags.discount === 1 ? "" : "s"}</StatusBadge>
          </div>
        </Section>

        <Section title="Connected books" actions={<Link href="/integrations" className="text-xs text-muted-foreground hover:text-foreground">Manage on Integrations →</Link>}>
          {p.books.length === 0 ? (
            <EmptyLine>No QuickBooks company connected yet.</EmptyLine>
          ) : (
            <ul>
              {p.books.map((book) => (
                <li key={book.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-border px-3 py-2 last:border-0">
                  <span className={cn("size-1.5 rounded-full", book.status === "connected" ? "bg-success" : "bg-destructive")} aria-hidden />
                  <b className="text-sm">{book.companyName}</b>
                  <span className="font-mono text-xs text-muted-foreground">{book.realmIdMasked}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {book.openBills} open · {book.lastSyncedAt ? `read ${agoLabel(book.lastSyncedAt)}` : "not read yet"}
                  </span>
                  {book.lastError && <span className="w-full text-xs text-warning">{book.lastError}</span>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Ladder({ title, tone, icon, items }: { title: string; tone: "success" | "warning" | "destructive"; icon: React.ReactNode; items: string[] }) {
  return (
    <div className="space-y-2">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
