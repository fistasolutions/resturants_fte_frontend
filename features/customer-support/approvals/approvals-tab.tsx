"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Layers, SearchX } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
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
import { Button } from "@/components/ui/button";
import { ApprovalCard, approvalChecks } from "@/features/customer-support/approvals/approval-card";
import { ApprovalsFilters, ApprovalsPager, goTo } from "@/features/customer-support/approvals/approvals-toolbar";
import { ReasonDialog } from "@/features/customer-support/reason-dialog";
import { ListSkeleton } from "@/features/customer-support/skeletons";
import { ActionFeedback, EmptyNote } from "@/features/customer-support/support-ui";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { isEditableTarget } from "@/lib/chat-drawer-prompts";
import { clientApi } from "@/lib/client-api";
import { autopilotEligible, topicLabel } from "@/lib/customer-support";
import { cn } from "@/lib/utils";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { approvalsHref, approvalsQuery, approvalsViewFrom, pageCount } from "@/lib/support-approvals";
import { neighbour } from "@/lib/support-inbox";
import { approveReply, bulkApprove, rejectReply, sendBack } from "@/services/customer-support-actions";
import type { Approval, SupportWorkspace, TopicKey } from "@/types/customer-support";
import { MessageBody } from "@/features/customer-support/message-body";

/** Bulk approval only for topics the owner marked bulk-safe, and only when every guardrail
 * passes and the agent is confident enough to have sent it on autopilot. */
function bulkEligible(approval: Approval, workspace: SupportWorkspace, bulkSafe: ReadonlySet<TopicKey>): boolean {
  if (!bulkSafe.has(approval.ticket.topic)) return false;
  return autopilotEligible(approvalChecks(approval, workspace), approval.draft, workspace.guardrails);
}

/**
 * Approvals (SPEC-346): every reply waiting for the owner, oldest first, each with the full
 * pre-send panel when focused. j / k move, a approves, e edits, r rejects (to a person), b
 * sends back with a reason — the Brand Brain Facts keys, never while typing.
 *
 * SPEC-347: a reply reaches a real customer, so `a` asks first and sends only from the
 * dialog. `a` and `r` act only on a card the owner chose (never the first one by default),
 * never on a held key, while a write is in flight, inside a dialog, or on a card being edited
 * (its unsaved text would be lost — the card's own Approve sends the edit).
 *
 * SPEC-349: filters and pages live in the URL and are served a page at a time (backend
 * SPEC-358). A change keeps the previous page on screen, dimmed, until the next arrives — the
 * filter bar, the hints and the pager never unmount; the skeleton is the first load only. The
 * next page is warmed as soon as this one shows. Focus and selection belong to one view, so they
 * reset when the filters or the page change.
 */
export function ApprovalsTab() {
  const params = useSearchParams();
  const view = approvalsViewFrom(new URLSearchParams(params.toString()));
  const viewKey = approvalsQuery(view);
  const approvals = useApiQuery(customerSupportQueries.approvalsPage(view), { placeholderData: keepPreviousData });
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const topics = useApiQuery(customerSupportQueries.topics());
  const actions = useSupportActions();
  const can = useCan();
  // Sending a reply reaches a customer (both permissions); rejecting or editing manages the queue.
  const sendGate = can(["messages.send", "team_performance.manage"]);
  const manageGate = can("team_performance.manage");
  const queryClient = useQueryClient();
  const [focus_, setFocus] = useState<{ key: string; id: string | null }>({ key: viewKey, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ key: string; ids: ReadonlySet<string> }>({ key: viewKey, ids: new Set() });
  const [sendingBack, setSendingBack] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const focusedId = focus_.key === viewKey ? focus_.id : null;
  const setFocusedId = (id: string | null) => setFocus({ key: viewKey, id });
  const selected = selection.key === viewKey ? selection.ids : new Set<string>();
  const setSelected = (update: ReadonlySet<string> | ((current: ReadonlySet<string>) => ReadonlySet<string>)) =>
    setSelection((current) => {
      const base = current.key === viewKey ? current.ids : new Set<string>();
      return { key: viewKey, ids: typeof update === "function" ? update(base) : update };
    });
  const page = approvals.data ?? null;
  const refreshing = approvals.isPlaceholderData;

  // The next page is one click away: warm it as soon as this one shows.
  useEffect(() => {
    if (!page || refreshing || page.page >= pageCount(page.total, page.pageSize)) return;
    const def = customerSupportQueries.approvalsPage({ ...view, page: page.page + 1 });
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
    // `view` is derived from the URL each render; `viewKey` is its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshing, queryClient, viewKey]);

  const list = useMemo(() => approvals.data?.items ?? [], [approvals.data]);
  const focus = list.find((a) => a.id === focusedId) ?? list[0] ?? null;
  const ws = workspace.data ?? null;
  const chosen = focusedId !== null && focus?.id === focusedId ? focus : null;
  const confirming = list.find((a) => a.id === confirmingId) ?? null;
  const dialogOpen = sendingBack !== null || confirmingId !== null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!focus || !ws || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (dialogOpen || actions.busy !== null) return;
      const target = event.target as HTMLElement | null;
      if (target && isEditableTarget(target.tagName, target.isContentEditable)) return;
      if (target?.closest("[role=dialog], [role=alertdialog]")) return;
      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        const next = neighbour(list, focus.id, event.key === "j" ? 1 : -1);
        setFocusedId(next);
        setEditingId(null);
        document.querySelector<HTMLElement>(`[data-approval-id="${next}"]`)?.scrollIntoView({ block: "nearest" });
      } else if (event.key === "a") {
        if (!chosen || editingId === chosen.id || !sendGate.allowed) return;
        const checks = approvalChecks(chosen, ws);
        if (checks.every((check) => check.result !== "block")) {
          event.preventDefault();
          setConfirmingId(chosen.id);
        }
      } else if (event.key === "e") {
        if (!manageGate.allowed) return;
        event.preventDefault();
        setEditingId(focus.id);
      } else if (event.key === "r") {
        if (chosen && manageGate.allowed) void actions.run("reject", () => rejectReply(chosen.id));
      } else if (event.key === "b") {
        if (sendGate.allowed) setSendingBack(focus.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, chosen, ws, list, actions, dialogOpen, editingId, viewKey, sendGate.allowed, manageGate.allowed]);

  if (approvals.isPending || workspace.isPending || topics.isPending) return <ListSkeleton />;
  if (approvals.isError) return <QueryErrorState error={approvals.error} onRetry={() => void approvals.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  if (topics.isError) return <QueryErrorState error={topics.error} onRetry={() => void topics.refetch()} />;

  const w = workspace.data;
  const current = approvals.data;
  const bulkSafe = new Set(topics.data.topics.filter((t) => t.bulkSafe).map((t) => t.key));
  const eligible = list.filter((a) => bulkEligible(a, w, bulkSafe));
  const picked = eligible.filter((a) => selected.has(a.id));

  return (
    <div className="space-y-3">
      <ActionFeedback
        notice={actions.notice}
        error={actions.error}
        onDismiss={() => {
          actions.clearError();
          actions.clearNotice();
        }}
      />
      {current.counts.all === 0 ? (
        <EmptyNote icon={CircleCheck} title="Nothing waits for your approval">
          New drafts land here as customers write in. Topics on autopilot send on their own, inside the guardrails.
        </EmptyNote>
      ) : (
        <>
          <ApprovalsFilters view={view} counts={current.counts} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{current.counts.all}</span>{" "}
              {current.counts.all === 1 ? "reply waits" : "replies wait"}
              {current.total !== current.counts.all ? (
                <>
                  {" "}
                  · <span className="font-semibold tabular-nums text-foreground">{current.total}</span> match
                </>
              ) : null}
              .
            </p>
            <p className="hidden text-[11px] text-muted-foreground md:block">
              {["j", "k"].map((k) => (
                <kbd key={k} className="mr-0.5 rounded border border-border px-1">
                  {k}
                </kbd>
              ))}{" "}
              move · <kbd className="rounded border border-border px-1">a</kbd> approve (asks first) · <kbd className="rounded border border-border px-1">e</kbd> edit ·{" "}
              <kbd className="rounded border border-border px-1">b</kbd> send back · <kbd className="rounded border border-border px-1">r</kbd> reject
            </p>
            <div className="ml-auto flex items-center gap-2">
              {eligible.length ? (
                <>
                  <RoleGate need={["messages.send", "team_performance.manage"]}>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(eligible.map((a) => a.id)))}>
                      Select all bulk-safe ({eligible.length})
                    </Button>
                  </RoleGate>
                  <RoleButton
                    need={["messages.send", "team_performance.manage"]}
                    size="sm"
                    disabled={picked.length === 0 || actions.busy !== null}
                    onClick={() =>
                      void actions.run("bulk", () => bulkApprove(picked.map((a) => a.id))).then((ok) => ok && setSelected(new Set()))
                    }
                  >
                    <Layers aria-hidden /> Approve {picked.length || ""} selected
                  </RoleButton>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Bulk approval: only for bulk-safe topics ({[...bulkSafe].map(topicLabel).join(", ") || "none set"}) with every guardrail passing.
                </span>
              )}
            </div>
          </div>
          {!sendGate.allowed ? <p className="text-xs text-muted-foreground">{sendGate.reason}</p> : null}
          {list.length === 0 ? (
            <EmptyNote icon={SearchX} title="No replies match these filters">
              <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => goTo(approvalsHref({ ...view, topic: null, channel: null, confidence: null, q: "" }, { page: 1 }))}>
                Clear the filters
              </button>{" "}
              to see every reply waiting.
            </EmptyNote>
          ) : null}
          <ol
            aria-label="Replies waiting for approval"
            aria-busy={refreshing}
            className={cn("space-y-2 transition-opacity duration-150", refreshing && "pointer-events-none opacity-60")}
          >
            {list.map((approval) => (
              <ApprovalCard
                key={`${approval.id}:${approval.draft.id}`}
                approval={approval}
                workspace={w}
                focused={approval.id === focus?.id}
                editing={approval.id === editingId}
                bulkEligible={eligible.some((a) => a.id === approval.id)}
                selected={selected.has(approval.id)}
                busy={actions.busy !== null}
                onFocus={() => setFocusedId(approval.id)}
                onToggleSelect={(value) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (value) next.add(approval.id);
                    else next.delete(approval.id);
                    return next;
                  })
                }
                onEdit={(value) => setEditingId(value ? approval.id : null)}
                onApprove={(body) =>
                  void actions.run("approve", () => approveReply(approval.id, body ?? undefined))
                }
                onSendBack={() => setSendingBack(approval.id)}
                onReject={() => void actions.run("reject", () => rejectReply(approval.id))}
              />
            ))}
          </ol>
          {current.total > 0 ? <ApprovalsPager view={view} page={current} /> : null}
        </>
      )}
      <AlertDialog open={confirming !== null} onOpenChange={(open) => (open ? undefined : setConfirmingId(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this reply to {confirming?.ticket.customer.name || "the customer"}?</AlertDialogTitle>
            <AlertDialogDescription>
              It goes to {confirming?.ticket.customer.email || "them"} through Gorgias, exactly as written below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 min-w-0 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
            <MessageBody body={confirming?.draft.body ?? ""} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actions.busy !== null || !sendGate.allowed}
              onClick={() => {
                const id = confirming?.id;
                setConfirmingId(null);
                if (id) void actions.run("approve", () => approveReply(id));
              }}
            >
              Send reply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReasonDialog
        open={sendingBack !== null}
        onOpenChange={(open) => (open ? undefined : setSendingBack(null))}
        title="Send this draft back"
        description="The agent redrafts with your note. Say what to change — the fact it got wrong, the tone, what to offer."
        label="What should change?"
        confirmLabel="Send back"
        onConfirm={(reason) => {
          const id = sendingBack;
          if (id) void actions.run("sendback", () => sendBack(id, reason));
        }}
      />
    </div>
  );
}
