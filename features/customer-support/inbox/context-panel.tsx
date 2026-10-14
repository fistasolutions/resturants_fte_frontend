"use client";

import Link from "next/link";
import { Crown } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Fact } from "@/features/customer-support/support-ui";
import { healthBadgeClass } from "@/lib/customer-health";
import {
  FULFILMENT_LABELS,
  RETURN_LABELS,
  bracketingLine,
  bracketingWorthNoting,
  formatMoney,
  isLate,
  stockLine,
  topicLabel,
} from "@/lib/customer-support";
import { VERDICT_META, fitStyleHref } from "@/lib/fit";
import { can } from "@/lib/helpdesk-providers";
import { cn } from "@/lib/utils";
import type { HelpdeskProviderKey, SupportTicket, TicketContext } from "@/types/customer-support";
import { formatDate } from "@/utils/format";

function Section({ title, source, children }: { title: string; source?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-b border-border px-4 py-3 last:border-b-0">
      <h3 className="flex items-baseline justify-between gap-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {title}
        {source ? <span className="text-[10px] font-semibold normal-case tracking-normal text-muted-foreground/70">{source}</span> : null}
      </h3>
      {children}
    </section>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/**
 * What the agent knows about this ticket (SPEC-346) — the facts a helpdesk's own AI cannot
 * see: the customer's value and health, where the order sits against the shop's handling
 * time, the real return and refund state, which way each item fits, real stock and incoming
 * transfers, and bracketing described as behaviour. Every figure is the platform's own.
 */
export function ContextPanel({
  ticket,
  context,
  provider,
}: {
  ticket: SupportTicket;
  context: TicketContext;
  provider: HelpdeskProviderKey;
}) {
  const c = ticket.customer;
  const f = context.fulfilment;
  const r = context.return;
  return (
    <aside className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card [overflow-wrap:anywhere]" aria-label="What the agent knows">
      <Section title="Customer" source="Customers">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{c.name}</p>
          {c.vip ? (
            <StatusBadge tone="warning">
              <Crown className="size-3" aria-hidden /> VIP
            </StatusBadge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
        <Fact label="Lifetime value">{formatMoney(c.lifetimeValue)}</Fact>
        <Fact label="Orders">{c.orders}</Fact>
        <Fact label="Health">
          <span className={cn("rounded-full px-2 py-0.5 text-xs", healthBadgeClass(c.health.tone))}>{c.health.verdict}</span>
        </Fact>
        {context.history.length ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Earlier tickets</p>
            <ul className="space-y-1">
              {context.history.map((h) => (
                <li key={h.id} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate text-foreground">{h.subject}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {topicLabel(h.topic)}
                    {h.csat !== null ? ` · ${h.csat}/5` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No earlier tickets.</p>
        )}
        {c.shopifyCustomerId ? (
          <Link href="/customers" prefetch={false} className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
            Open in Customers
          </Link>
        ) : null}
      </Section>

      <Section title="Order & fulfilment" source="Shopify · iPacky">
        {context.order ? (
          <>
            <Fact label="Order">
              <Link href={context.order.href} prefetch={false} className="font-medium text-primary underline-offset-4 hover:underline">
                {context.order.name}
              </Link>
            </Fact>
            <Fact label="Total">{formatMoney(context.order.total)}</Fact>
            <Fact label="Margin">{formatMoney(context.order.margin)}</Fact>
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {context.order.lines.map((line) => (
                <li key={`${line.productId}-${line.variant}`}>
                  {line.quantity} × {line.title} · {line.variant}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Missing>No order on this ticket.</Missing>
        )}
        {f ? (
          <div className="space-y-1 rounded-lg bg-muted/40 p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={isLate(f) || f.status === "exception" ? "destructive" : f.status === "delivered" ? "success" : "neutral"}>
                {FULFILMENT_LABELS[f.status]}
              </StatusBadge>
              {isLate(f) ? <StatusBadge tone="destructive">Late</StatusBadge> : null}
              <span className="text-xs text-muted-foreground">{f.location}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {f.waitingDays} {f.waitingDays === 1 ? "day" : "days"} since the order · handling time {f.handlingDays} days
            </p>
            {f.carrier ? (
              <p className="text-xs text-muted-foreground">
                {f.carrier}
                {f.tracking ? ` · ${f.tracking}` : ""}
                {f.eta ? ` · due ${formatDate(f.eta)}` : ""}
              </p>
            ) : null}
            {f.lastEvent ? <p className="text-xs text-foreground">{f.lastEvent}</p> : null}
          </div>
        ) : null}
      </Section>

      <Section title="Return or exchange" source="Loop Returns">
        {r ? (
          <>
            <StatusBadge tone={r.status === "refunded" || r.status === "exchanged" ? "success" : "info"}>{RETURN_LABELS[r.status]}</StatusBadge>
            <Fact label="Outcome">{r.outcome === "store_credit" ? "Store credit" : r.outcome === "exchange" ? "Exchange" : "Refund"}</Fact>
            {r.exchangeTo ? <Fact label="Exchanging to">{r.exchangeTo}</Fact> : null}
            {r.refund ? <Fact label="Refund">{formatMoney(r.refund)}</Fact> : null}
            {r.refundExpectedAt ? <Fact label="Refund expected">{formatDate(r.refundExpectedAt)}</Fact> : null}
          </>
        ) : (
          <Missing>No return or exchange open.</Missing>
        )}
      </Section>

      <Section title="Fit" source="Fit Intelligence">
        {context.fit.length ? (
          <ul className="space-y-2">
            {context.fit.map((fit) => (
              <li key={fit.productId} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <Link href={fitStyleHref(fit.productId)} prefetch={false} className="truncate text-sm text-foreground underline-offset-4 hover:underline">
                    {fit.title}
                  </Link>
                  <StatusBadge tone={VERDICT_META[fit.verdict].tone}>{VERDICT_META[fit.verdict].label}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground">{fit.advice}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Missing>No sized items on this ticket.</Missing>
        )}
      </Section>

      <Section title="Stock & restock" source="Inventory">
        {context.stock.length ? (
          <ul className="space-y-1.5">
            {context.stock.map((s) => (
              <li key={`${s.productId}-${s.variant}`} className="text-xs">
                <p className="text-foreground">
                  {s.title} · {s.variant}
                </p>
                <p className={s.available > 0 ? "text-muted-foreground" : "text-warning"}>
                  {stockLine(s)}
                  {s.incoming?.expectedAt ? ` · due ${formatDate(s.incoming.expectedAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Missing>No stock question on this ticket.</Missing>
        )}
      </Section>

      {bracketingWorthNoting(context.bracketing) ? (
        <Section title="Ordering pattern" source="Returns → Bracketing">
          <p className="text-xs text-muted-foreground">{bracketingLine(context.bracketing)}</p>
          <Link href="/returns?tab=bracketing" prefetch={false} className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
            Open Bracketing
          </Link>
        </Section>
      ) : null}

      {can(provider, "macros") ? (
        <Section title="Suggested macros" source="Helpdesk">
          {context.macros.length ? (
            <ul className="space-y-1">
              {context.macros.map((macro) => (
                <li key={macro.id} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate text-foreground">{macro.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{macro.usedThisMonth} this month</span>
                </li>
              ))}
            </ul>
          ) : (
            <Missing>No macro fits this ticket.</Missing>
          )}
        </Section>
      ) : null}
    </aside>
  );
}
