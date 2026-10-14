import { ExternalLink } from "lucide-react";

import { formatDuration } from "@/lib/format-duration";
import { cleanMessageBody } from "@/lib/format-message";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";
import type {
  GorgiasConversationDetail,
  GorgiasConversationTicket,
  GorgiasMessage,
} from "@/types/gorgias";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function CustomerShopifyPanel({ ticket }: { ticket: GorgiasConversationTicket }) {
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Customer&apos;s Shopify history</p>
        <span className="text-xs text-muted-foreground">matched by email</span>
      </div>
      {!ticket.customer_matched ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No matching Shopify customer for this email.
        </p>
      ) : (
        <dl className="mt-3 grid grid-cols-2 gap-4">
          <Field label="Orders" value={String(ticket.customer_order_count ?? 0)} />
          <Field
            label="Order (nearest date)"
            value={
              ticket.order_number
                ? `${ticket.order_number}${
                    ticket.latest_order_status ? ` · ${ticket.latest_order_status}` : ""
                  }`
                : "—"
            }
          />
          <Field
            label="Refunds (all-time)"
            value={ticket.refund_amount === null ? "—" : formatCurrency(ticket.refund_amount)}
          />
          <Field
            label="Exchanges (all-time)"
            value={ticket.exchange_amount === null ? "—" : formatCurrency(ticket.exchange_amount)}
          />
        </dl>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Customer-level totals — Gorgias doesn&apos;t link a ticket to a specific order.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: GorgiasMessage }) {
  const agent = message.from_agent;
  const who = agent ? (message.sender_name ?? "Agent") : "Customer";
  const when = message.created_at
    ? `${formatDate(message.created_at)} · ${formatTime(message.created_at)}`
    : "";
  const body = cleanMessageBody(message.body_text);
  return (
    <li className={`flex ${agent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-card p-3 ring-1 ${
          agent ? "bg-primary/5 ring-primary/15" : "bg-card ring-foreground/10"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-foreground">{who}</span>
          <span className="text-muted-foreground">{when}</span>
        </div>
        {body ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{body}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No message text.</p>
        )}
      </div>
    </li>
  );
}

/** Full conversation thread (SPEC-094): ticket summary + every message, with
 * agent replies aligned right and the actual sender named. */
export function ConversationThread({ detail }: { detail: GorgiasConversationDetail }) {
  const t = detail.ticket;
  return (
    // `lg:items-start` lets the sidebar stick independently of the (often long)
    // thread column (SPEC-094 Patch).
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <section className="space-y-4 lg:col-span-2">
        <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
          <h1 className="font-heading text-xl tracking-wide">{t.subject ?? "Conversation"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.customer_name ?? "Unknown customer"}
            {t.order_number ? ` · ${t.order_number}` : ""}
          </p>
        </div>

        {detail.messages.length === 0 ? (
          <p className="rounded-card bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            No messages have been synced for this conversation yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {detail.messages.map((message) => (
              <MessageBubble key={message.gorgias_message_id} message={message} />
            ))}
          </ul>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <dl className="grid grid-cols-2 gap-4 rounded-card bg-card p-4 ring-1 ring-foreground/10">
          <Field label="Status" value={t.status} />
          <Field label="Channel" value={t.channel ?? "—"} />
          <Field label="Agent" value={t.staff_name ?? t.agent_name ?? "Unassigned"} />
          <Field
            label="Response time"
            value={formatDuration(t.response_time_seconds)}
          />
          <Field label="Contact reason" value={t.contact_reason ?? "—"} />
          <Field
            label="CSAT"
            value={t.satisfaction_score === null ? "—" : t.satisfaction_score.toFixed(1)}
          />
          <Field
            label="Opened"
            value={t.created_at ? formatDate(t.created_at) : "—"}
          />
        </dl>
        <CustomerShopifyPanel ticket={t} />
        {t.customer_email ? (
          <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">Customer email</p>
            <p className="mt-0.5 text-sm break-all text-foreground">{t.customer_email}</p>
          </div>
        ) : null}
        {t.gorgias_url ? (
          <a
            href={t.gorgias_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Open in Gorgias
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
      </aside>
    </div>
  );
}
