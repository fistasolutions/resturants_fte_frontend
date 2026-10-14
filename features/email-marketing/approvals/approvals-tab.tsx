"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CornerUpLeft, PenLine, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { EmLink } from "@/features/email-marketing/em-link";
import { PreSendPanel } from "@/features/email-marketing/pre-send-panel";
import { ReasonDialog } from "@/features/email-marketing/reason-dialog";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useSendContext } from "@/features/email-marketing/use-send-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { accessGate } from "@/lib/email-access";
import { REJECT_MIN } from "@/lib/email-plan";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import { decideApproval, sendSeedTest } from "@/services/email-marketing-actions";
import type { Approval } from "@/types/email-marketing";

const KIND_LABEL: Record<Approval["kind"], string> = { campaign: "Campaign", flow_activation: "Turn on a flow", flow_message: "Flow message" };

/**
 * Everything waiting for the owner (SPEC-345), each with the full pre-send panel where it
 * sends. Approve, edit, send back with a reason, or reject; j/k move, a approves, r rejects
 * (as Brand Brain Facts). Approving a send still runs every guardrail — a blocked send's
 * approve stays disabled in its panel.
 *
 * SPEC-347: turning a flow on starts emailing customers, so it always asks first — by button
 * or by `a` — and `a` waits for a write in flight and respects the kill switch, like the button.
 */
export function ApprovalsTab() {
  const approvals = useApiQuery(emailMarketingQueries.approvals());
  const campaigns = useApiQuery(emailMarketingQueries.campaigns());
  const state = useSendContext();
  const actions = useEmailMarketingActions();
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState<"reject" | "send_back" | null>(null);
  const [turningOn, setTurningOn] = useState(false);
  const can = useCan();
  // Every decision here (approve, send back, reject) is the role's to make (SPEC-358).
  const roleSend = can("email_marketing.send");

  const list = approvals.data ?? [];
  const current = list[Math.min(index, Math.max(0, list.length - 1))] ?? null;
  const campaign = current?.campaignId ? campaigns.data?.find((c) => c.id === current.campaignId) ?? null : null;

  const decide = useCallback(
    (decision: "approve" | "send_back" | "reject", reason: string | null, typed: string | null = null) => {
      if (!current) return;
      void actions.run("decide", () => decideApproval(current.id, decision, reason, typed));
    },
    [actions, current],
  );
  const killSwitch = state.status === "ready" && state.ctx.killSwitch;
  // Turning a flow on writes to Klaviyo; a key without flow access cannot (backend SPEC-362).
  const flowGate = accessGate(state.status === "ready" ? state.workspace.access : undefined, "flows");
  const keyBlocks = current?.kind === "flow_activation" && !flowGate.allowed;
  const approveCurrent = useCallback(() => {
    if (!current || current.campaignId || actions.busy !== null || killSwitch || keyBlocks || !roleSend.allowed) return;
    if (current.kind === "flow_activation") setTurningOn(true);
    else decide("approve", null);
  }, [actions.busy, current, decide, killSwitch, keyBlocks, roleSend.allowed]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (asking || turningOn || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (target && (target.closest("input, textarea, select, [contenteditable=true], [role=dialog]") !== null)) return;
      if (event.key === "j") setIndex((i) => Math.min(i + 1, Math.max(0, list.length - 1)));
      else if (event.key === "k") setIndex((i) => Math.max(0, i - 1));
      else if (event.key === "r" && current && roleSend.allowed) setAsking("reject");
      else if (event.key === "a" && current && !current.campaignId) approveCurrent();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking, turningOn, current, approveCurrent, list.length, roleSend.allowed]);

  if (approvals.isPending || campaigns.isPending || state.status === "pending") return <ListSkeleton rows={4} />;
  if (approvals.isError) return <QueryErrorState error={approvals.error} onRetry={() => void approvals.refetch()} />;
  if (campaigns.isError) return <QueryErrorState error={campaigns.error} onRetry={() => void campaigns.refetch()} />;
  if (state.status === "error") return <QueryErrorState error={state.error} onRetry={state.retry} />;
  if (list.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing is waiting for you. New proposals appear here before anything sends.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-2">
        <ol className="space-y-1" aria-label="Waiting for you">
          {list.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={current?.id === a.id ? "true" : undefined}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  current?.id === a.id ? "border-foreground bg-card" : "border-border hover:bg-muted/50",
                )}
              >
                <span className="block text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">{KIND_LABEL[a.kind]}</span>
                <span className="block text-sm font-medium">{a.title}</span>
                <span className="block text-[11px] text-muted-foreground">{relativeTime(a.requestedAt)}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-muted-foreground">
          Keys: <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd> move · <kbd className="rounded border border-border px-1">a</kbd> approve (flows) · <kbd className="rounded border border-border px-1">r</kbd> reject
        </p>
      </div>

      {current ? (
        <section className="min-w-0 space-y-4" aria-label={current.title}>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="warning">{KIND_LABEL[current.kind]}</StatusBadge>
              <h2 className="text-base font-semibold">{current.title}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Why: {current.why}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!current.campaignId ? (
                <RoleButton
                  need="email_marketing.send"
                  size="sm"
                  disabled={actions.busy !== null || state.ctx.killSwitch || keyBlocks}
                  onClick={approveCurrent}
                >
                  <Check aria-hidden />
                  {current.kind === "flow_activation" ? "Approve and turn on" : "Approve"}
                </RoleButton>
              ) : null}
              <EmLink
                href={current.campaignId ? `/email-marketing/campaigns/${current.campaignId}` : `/email-marketing/flows/${current.flowId}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <PenLine aria-hidden />
                Open
              </EmLink>
              <RoleButton need="email_marketing.send" size="sm" variant="outline" disabled={actions.busy !== null} onClick={() => setAsking("send_back")}>
                <CornerUpLeft aria-hidden />
                Send back…
              </RoleButton>
              <RoleButton need="email_marketing.send" size="sm" variant="ghost" disabled={actions.busy !== null} onClick={() => setAsking("reject")}>
                <X aria-hidden />
                Reject…
              </RoleButton>
            </div>
            {!roleSend.allowed ? (
              <p className="mt-2 text-sm text-muted-foreground">{roleSend.reason}</p>
            ) : keyBlocks ? (
              <p className="mt-2 text-sm text-muted-foreground">{flowGate.reason}</p>
            ) : null}
            {actions.error ? <p role="alert" className="mt-2 text-sm text-destructive">{actions.error}</p> : null}
          </div>
          {campaign ? (
            <PreSendPanel
              campaign={campaign}
              ctx={state.ctx}
              guardrails={state.workspace.guardrails}
              catalog={state.content.catalog}
              fromName={state.workspace.sender.fromName}
              advice={state.content.adviceBlock}
              busy={actions.busy !== null}
              onSendTest={() => void actions.run("test", () => sendSeedTest(campaign.id))}
              onApprove={(typed) => decide("approve", null, typed)}
            />
          ) : null}
        </section>
      ) : null}

      <AlertDialog open={turningOn} onOpenChange={setTurningOn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn on {current?.title.replace(/^Turn on:\s*/, "") || "this flow"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Once it is live, Klaviyo emails every customer who meets its trigger, on its own, until you turn it off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actions.busy !== null || !roleSend.allowed}
              onClick={() => {
                setTurningOn(false);
                decide("approve", null);
              }}
            >
              Turn it on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReasonDialog
        open={asking !== null}
        onOpenChange={(open) => (open ? undefined : setAsking(null))}
        title={asking === "send_back" ? "Send it back to the employee?" : "Reject it?"}
        description={asking === "send_back" ? "Say what to change; it comes back to you as a new version." : "Say why, so the employee does not propose it again."}
        label={asking === "send_back" ? "What should change?" : "Why not?"}
        confirmLabel={asking === "send_back" ? "Send back" : "Reject"}
        minLength={REJECT_MIN}
        onConfirm={(reason) => decide(asking === "send_back" ? "send_back" : "reject", reason)}
      />
    </div>
  );
}
