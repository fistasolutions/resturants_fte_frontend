"use client";

import { useState } from "react";
import { ChevronDown, Crown, PencilLine, Send, Undo2, UserRoundX } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PreSendPanel } from "@/features/customer-support/pre-send-panel";
import { ChannelMark } from "@/features/customer-support/support-ui";
import {
  CONFIDENCE_META,
  bannedHitsIn,
  canSend,
  confidenceBand,
  guardrailCheck,
  topicLabel,
  type GuardrailCheck,
} from "@/lib/customer-support";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import type { Approval, SupportWorkspace } from "@/types/customer-support";
import { MessageBody } from "@/features/customer-support/message-body";

export function approvalChecks(approval: Approval, workspace: SupportWorkspace, body?: string): GuardrailCheck[] {
  const draft =
    body !== undefined && body !== approval.draft.body
      ? { ...approval.draft, body, bannedHits: bannedHitsIn(body, workspace.guardrails.bannedWords) }
      : approval.draft;
  return guardrailCheck({ ticket: approval.ticket, draft, guardrails: workspace.guardrails, killSwitch: workspace.killSwitch.active });
}

/**
 * One reply waiting for the owner (SPEC-346). Collapsed it is one line — who, what, how sure,
 * whether anything blocks it; focused it opens the full pre-send panel and the four decisions.
 */
export function ApprovalCard({
  approval,
  workspace,
  focused,
  editing,
  bulkEligible,
  selected,
  busy,
  onFocus,
  onToggleSelect,
  onEdit,
  onApprove,
  onSendBack,
  onReject,
}: {
  approval: Approval;
  workspace: SupportWorkspace;
  focused: boolean;
  editing: boolean;
  bulkEligible: boolean;
  selected: boolean;
  busy: boolean;
  onFocus: () => void;
  onToggleSelect: (value: boolean) => void;
  onEdit: (editing: boolean) => void;
  onApprove: (body: string | null) => void;
  onSendBack: () => void;
  onReject: () => void;
}) {
  const { ticket, draft } = approval;
  const [body, setBody] = useState(draft.body);
  const checks = approvalChecks(approval, workspace, body);
  const verdict = canSend(checks);
  const band = confidenceBand(draft.confidence);
  const edited = body !== draft.body;
  const now = new Date();

  return (
    <li
      data-approval-id={approval.id}
      className={cn("rounded-2xl border bg-card transition-colors", focused ? "border-foreground/40" : "border-border")}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {bulkEligible ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => onToggleSelect(value === true)}
            aria-label={`Select ${ticket.subject} for bulk approval`}
          />
        ) : (
          <span className="size-4 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={onFocus}
          aria-expanded={focused}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChannelMark channel={ticket.channel} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{ticket.customer.name}</span>
              {ticket.customer.vip ? <Crown className="size-3.5 shrink-0 text-warning" aria-label="VIP" /> : null}
              <span className="truncate text-sm text-muted-foreground">· {ticket.subject}</span>
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {topicLabel(ticket.topic)} · waiting {relativeTime(approval.waitingSince, now).replace(" ago", "")}
            </span>
          </span>
          <StatusBadge tone={CONFIDENCE_META[band].tone}>{Math.round(draft.confidence * 100)}%</StatusBadge>
          {!verdict.allowed ? <StatusBadge tone="destructive">Blocked</StatusBadge> : null}
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", focused && "rotate-180")} aria-hidden />
        </button>
      </div>
      {focused ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <PreSendPanel
            ticket={ticket}
            draft={{ ...draft, body, bannedHits: edited ? bannedHitsIn(body, workspace.guardrails.bannedWords) : draft.bannedHits }}
            context={approval.context}
            customerMessage={approval.customerMessage}
            guardrails={workspace.guardrails}
            checks={checks}
            body={
              editing ? (
                <Textarea aria-label="Edit the reply" value={body} onChange={(event) => setBody(event.target.value)} rows={8} autoFocus />
              ) : (
                <MessageBody body={body} className="rounded-xl border border-border bg-background px-3 py-2" />
              )
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <RoleButton need={["messages.send", "team_performance.manage"]} size="sm" disabled={!verdict.allowed || busy} onClick={() => onApprove(edited ? body : null)}>
              <Send aria-hidden /> {edited ? "Approve edited reply" : "Approve & send"}
            </RoleButton>
            <RoleGate need="team_performance.manage">
              <Button size="sm" variant="outline" onClick={() => onEdit(!editing)} aria-pressed={editing}>
                <PencilLine aria-hidden /> {editing ? "Done editing" : "Edit"}
              </Button>
            </RoleGate>
            <RoleButton need={["messages.send", "team_performance.manage"]} size="sm" variant="outline" onClick={onSendBack} disabled={busy}>
              <Undo2 aria-hidden /> Send back
            </RoleButton>
            <RoleButton need="team_performance.manage" size="sm" variant="ghost" onClick={onReject} disabled={busy}>
              <UserRoundX aria-hidden /> Reject
            </RoleButton>
            {!verdict.allowed ? (
              <span className="text-xs text-destructive">Blocked: {verdict.blockers.map((b) => b.label.toLowerCase()).join(", ")}.</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
