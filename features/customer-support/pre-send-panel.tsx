"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { ChannelMark, CheckList, SourceChips } from "@/features/customer-support/support-ui";
import {
  CONFIDENCE_META,
  FULFILMENT_LABELS,
  OFFER_LABELS,
  RETURN_LABELS,
  bracketingWorthNoting,
  confidenceBand,
  formatMoney,
  isLate,
  offerCheck,
  percent,
  stockLine,
  type GuardrailCheck,
} from "@/lib/customer-support";
import { VERDICT_META } from "@/lib/fit";
import { CHANNEL_LABELS } from "@/lib/helpdesk-providers";
import { cn } from "@/lib/utils";
import type { DraftReply, Guardrails, SupportTicket, TicketContext } from "@/types/customer-support";
import { MessageBody } from "@/features/customer-support/message-body";

/** One line per thing the agent looked up before writing — what it found, not what it said. */
function foundLines(ticket: SupportTicket, context: TicketContext): string[] {
  const lines: string[] = [];
  if (context.order) lines.push(`Order ${context.order.name} · ${formatMoney(context.order.total)}`);
  if (context.fulfilment) {
    const f = context.fulfilment;
    lines.push(`${FULFILMENT_LABELS[f.status]} at ${f.location}${isLate(f) ? ` — late (${f.waitingDays} d vs ${f.handlingDays} d handling)` : ""}${f.carrier ? ` · ${f.carrier}` : ""}`);
  }
  if (context.return) {
    const r = context.return;
    lines.push(`${RETURN_LABELS[r.status]}${r.refund ? ` · ${formatMoney(r.refund)}` : ""}${r.exchangeTo ? ` · exchange to ${r.exchangeTo}` : ""}`);
  }
  for (const fit of context.fit) lines.push(`${fit.title}: ${VERDICT_META[fit.verdict].label.toLowerCase()}`);
  for (const stock of context.stock) lines.push(`${stock.title} ${stock.variant}: ${stockLine(stock).toLowerCase()}`);
  const c = ticket.customer;
  lines.push(`${c.name}: ${c.orders} orders · ${formatMoney(c.lifetimeValue, true)} lifetime${c.vip ? " · VIP" : ""}`);
  if (context.history.length) lines.push(`${context.history.length} earlier ${context.history.length === 1 ? "ticket" : "tickets"}`);
  if (bracketingWorthNoting(context.bracketing)) lines.push("Often orders more than one size of a style");
  return lines;
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-1.5", className)}>
      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

/**
 * Everything the owner must see before a reply can go (SPEC-346 §Safety): the customer's
 * message, what the agent found, a source for every fact, confidence and why, the brand-voice
 * score and banned words, any offer priced against the order's margin, the channel, and every
 * guardrail. The Send button is disabled by the same checks this lists.
 */
export function PreSendPanel({
  ticket,
  draft,
  context,
  customerMessage,
  guardrails,
  checks,
  body,
}: {
  ticket: SupportTicket;
  draft: DraftReply;
  context: TicketContext;
  /** Shown when the thread is not already on screen (Approvals). */
  customerMessage?: string;
  guardrails: Guardrails;
  checks: GuardrailCheck[];
  /** The reply as it stands — the draft, or the owner's edit. Omit to leave the body out. */
  body?: React.ReactNode;
}) {
  const band = confidenceBand(draft.confidence);
  const offer = draft.offer ? offerCheck(draft.offer, guardrails) : null;
  return (
    <div className="space-y-4">
      {customerMessage ? (
        <Block title="The customer wrote">
          <blockquote className="min-w-0 rounded-xl border-l-2 border-border bg-muted/40 px-3 py-2">
            <MessageBody body={customerMessage} />
          </blockquote>
        </Block>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div className="min-w-0 space-y-4">
          {body ? <Block title={`Reply · ${CHANNEL_LABELS[draft.channel]}`}>{body}</Block> : null}
          <Block title="Where each fact comes from">
            <SourceChips sources={draft.sources} />
          </Block>
          <Block title="Guardrails">
            <CheckList checks={checks} />
          </Block>
        </div>

        <aside className="min-w-0 space-y-4 rounded-xl border border-border bg-muted/30 p-3" aria-label="Why the agent wrote this">
          <Block title="Confidence">
            <div className="flex items-center gap-2">
              <StatusBadge tone={CONFIDENCE_META[band].tone}>{CONFIDENCE_META[band].label}</StatusBadge>
              <span className="text-sm tabular-nums text-muted-foreground">{percent(draft.confidence)}</span>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {draft.reasons.map((reason) => (
                <li key={reason} className="flex gap-1.5">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {reason}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Brand voice">
            <p className="text-sm">
              <span className={cn("font-semibold tabular-nums", draft.voiceScore >= 70 ? "text-foreground" : "text-warning")}>
                {draft.voiceScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </p>
            {draft.bannedHits.length ? (
              <p className="text-xs text-destructive">Banned: {draft.bannedHits.join(", ")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">No banned words or claims.</p>
            )}
          </Block>
          {draft.offer && offer ? (
            <Block title="Goodwill offer">
              <p className="text-sm text-foreground">
                {OFFER_LABELS[draft.offer.kind]} · <span className="font-semibold">{formatMoney(draft.offer.amount)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Order margin {formatMoney(draft.offer.orderMargin)} → {formatMoney({ amountMinor: offer.marginAfterMinor, currency: draft.offer.amount.currency })} (
                {Math.round(offer.marginAfterPercent)}% of the order)
              </p>
            </Block>
          ) : null}
          <Block title="Goes out on">
            <ChannelMark channel={draft.channel} label />
          </Block>
          <Block title="What it found">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {foundLines(ticket, context).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Block>
        </aside>
      </div>
    </div>
  );
}
