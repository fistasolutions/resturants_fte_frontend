"use client";

import { RotateCw, StickyNote } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { MessageBody } from "@/features/customer-support/message-body";
import { ChannelMark } from "@/features/customer-support/support-ui";
import { SEND_STATE_META } from "@/lib/customer-support";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

function SendState({
  message,
  onRetry,
  busy,
  roleReason,
}: {
  message: SupportMessage;
  onRetry: () => void;
  busy: boolean;
  roleReason: string | null;
}) {
  if (!message.sendState) return null;
  const meta = SEND_STATE_META[message.sendState];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      {message.failureReason ? <span className="text-[11px] text-destructive">{message.failureReason}</span> : null}
      {meta.retryable ? (
        <>
          <Button size="xs" variant="outline" onClick={onRetry} disabled={busy || roleReason !== null}>
            <RotateCw aria-hidden /> Retry
          </Button>
          {roleReason ? <span className="text-[11px] text-muted-foreground">{roleReason}</span> : null}
        </>
      ) : null}
    </span>
  );
}

/**
 * The conversation across channels (SPEC-346): the customer on the left, replies on the right
 * with their send state — the helpdesk sends asynchronously, so a reply is Queued until the
 * helpdesk confirms it Sent, or Failed with a retry — and internal notes drawn as notes, never
 * mistakable for something the customer saw.
 *
 * SPEC-348: every body goes through `MessageBody` — new words first, links as links,
 * attachments as chips, the earlier exchange folded — and every column here is `min-w-0`, so a
 * long URL can never widen the page.
 *
 * SPEC-364 (Rule 13): a role that may not resend sees Retry disabled with the role's reason
 * beside it.
 */
export function Thread({
  messages,
  onRetry,
  busy,
  roleReason = null,
}: {
  messages: SupportMessage[];
  onRetry: (messageId: string) => void;
  busy: boolean;
  /** Why the member's role may not retry a send; null when it may. */
  roleReason?: string | null;
}) {
  return (
    <ol className="min-w-0 space-y-3" aria-label="Conversation">
      {messages.map((message) => {
        if (message.visibility === "internal") {
          return (
            <li key={message.id} className="min-w-0 rounded-xl border border-dashed border-warning/40 bg-warning/5 px-3 py-2">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-warning">
                <StickyNote className="size-3.5" aria-hidden />
                Internal note · {message.author.name} · {formatDateTime(message.createdAt)}
              </p>
              <MessageBody body={message.body} strippedBody={message.strippedBody} attachments={message.attachments} />
            </li>
          );
        }
        const inbound = message.direction === "inbound";
        return (
          <li key={message.id} className={cn("flex min-w-0", inbound ? "justify-start" : "justify-end")}>
            <div
              className={cn(
                "min-w-0 max-w-[92%] space-y-1.5 rounded-2xl px-3 py-2 sm:max-w-[80%]",
                inbound ? "border border-border bg-card" : "bg-muted",
              )}
            >
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                {message.author.kind === "agent" ? <GlispIcon className="size-3.5" aria-hidden /> : null}
                <span className="font-semibold text-foreground">{message.author.name}</span>
                <ChannelMark channel={message.channel} />
                <span>{formatDateTime(message.createdAt)}</span>
              </p>
              <MessageBody body={message.body} strippedBody={message.strippedBody} attachments={message.attachments} />
              {!inbound ? <SendState message={message} busy={busy} roleReason={roleReason} onRetry={() => onRetry(message.id)} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
