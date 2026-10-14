"use client";

import { useState } from "react";
import { PencilLine, Send, StickyNote, Undo2, UserRoundCheck } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { PreSendPanel } from "@/features/customer-support/pre-send-panel";
import type { SupportActions } from "@/features/customer-support/use-support-actions";
import { bannedHitsIn, canSend, guardrailCheck } from "@/lib/customer-support";
import { can } from "@/lib/helpdesk-providers";
import { addNote, approveReply, editDraft, redraft, sendReply } from "@/services/customer-support-actions";
import type { SupportWorkspace, TicketDetail } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";
import { MessageBody } from "@/features/customer-support/message-body";

/**
 * Under the thread (SPEC-346): the agent's draft with everything the owner needs before it can
 * go, or — with no draft — the owner's own reply box. Send, Edit, Hand off and Internal note,
 * each only where the helpdesk can do it. Send is disabled by the same guardrail checks the
 * panel lists.
 */
export function ReplyBox({
  detail,
  workspace,
  actions,
  onHandoff,
}: {
  detail: TicketDetail;
  workspace: SupportWorkspace;
  actions: SupportActions;
  onHandoff: () => void;
}) {
  const { ticket, draft } = detail;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(draft?.body ?? "");
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const notes = can(workspace.provider, "internalNotes");
  const id = ticket.id;

  if (ticket.status === "closed") {
    return <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">This ticket is closed. A new message from the customer reopens it.</p>;
  }

  const noteBox = noting ? (
    <form
      className="space-y-2 rounded-xl border border-dashed border-warning/40 bg-warning/5 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void actions.run("note", () => addNote(id, note)).then((ok) => {
          if (ok) {
            setNote("");
            setNoting(false);
          }
        });
      }}
    >
      <label htmlFor={`${id}-note`} className="text-xs font-semibold text-warning">
        Internal note — only your team sees it
      </label>
      <Textarea id={`${id}-note`} value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
      <div className="flex gap-2">
        <RoleButton need="team_performance.manage" type="submit" size="sm" disabled={!note.trim() || actions.busy !== null}>
          Add note
        </RoleButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => setNoting(false)}>
          Cancel
        </Button>
      </div>
    </form>
  ) : null;

  const secondary = (
    <>
      <RoleGate need="team_performance.manage">
        <Button size="sm" variant="outline" onClick={onHandoff} disabled={actions.busy !== null}>
          <UserRoundCheck aria-hidden /> Hand off
        </Button>
        {notes ? (
          <Button size="sm" variant="ghost" onClick={() => setNoting((value) => !value)} aria-expanded={noting}>
            <StickyNote aria-hidden /> Internal note
          </Button>
        ) : null}
      </RoleGate>
    </>
  );

  if (!draft) {
    return (
      <div className="space-y-3">
        {detail.draftError ? (
          <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            The agent could not draft this one: {detail.draftError}
          </p>
        ) : null}
        {detail.returned ? (
          <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Undo2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Sent back {formatDateTime(detail.returned.at)}: “{detail.returned.reason}”. The agent redrafts with your note — or reply yourself
              below.
            </span>
          </p>
        ) : null}
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void actions.run("reply", () => sendReply(id, reply)).then((ok) => ok && setReply(""));
          }}
        >
          <label htmlFor={`${id}-reply`} className="text-xs font-semibold text-muted-foreground">
            Reply to {ticket.customer.name.split(" ")[0]} yourself
          </label>
          <Textarea id={`${id}-reply`} value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Write a reply…" />
          <div className="flex flex-wrap items-center gap-2">
            <RoleButton
              need={["messages.send", "team_performance.manage"]}
              type="submit"
              size="sm"
              disabled={!reply.trim() || actions.busy !== null}
            >
              <Send aria-hidden /> {actions.busy === "reply" ? "Sending…" : "Send reply"}
            </RoleButton>
            {secondary}
            <RoleButton
              need="team_performance.manage"
              type="button"
              size="sm"
              variant="ghost"
              disabled={actions.busy !== null}
              onClick={() => void actions.run("redraft", () => redraft(id))}
            >
              <GlispIcon className="size-4" aria-hidden /> {actions.busy === "redraft" ? "Drafting…" : "Ask the agent to draft"}
            </RoleButton>
          </div>
        </form>
        {noteBox}
      </div>
    );
  }

  const edited = body !== draft.body;
  const current = edited ? { ...draft, body, bannedHits: bannedHitsIn(body, workspace.guardrails.bannedWords) } : draft;
  const checks = guardrailCheck({
    ticket,
    draft: current,
    guardrails: workspace.guardrails,
    killSwitch: workspace.killSwitch.active,
  });
  const verdict = canSend(checks);

  return (
    <div className="space-y-3 rounded-2xl border border-ai/30 bg-ai/5 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <GlispIcon className="size-4" aria-hidden /> The agent’s draft
        <span className="font-normal text-muted-foreground">· written {formatDateTime(draft.generatedAt)}</span>
      </p>
      <PreSendPanel
        ticket={ticket}
        draft={current}
        context={detail.context}
        guardrails={workspace.guardrails}
        checks={checks}
        body={
          editing ? (
            <Textarea aria-label="Edit the reply" value={body} onChange={(event) => setBody(event.target.value)} rows={8} />
          ) : (
            <MessageBody body={body} className="rounded-xl border border-border bg-card px-3 py-2" />
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <RoleButton
          need={["messages.send", "team_performance.manage"]}
          size="sm"
          disabled={!verdict.allowed || actions.busy !== null}
          onClick={() =>
            void actions.run("send", () => approveReply(id, edited ? body : undefined))
          }
          title={verdict.allowed ? undefined : verdict.blockers.map((b) => b.reason).join(" ")}
        >
          <Send aria-hidden /> {actions.busy === "send" ? "Sending…" : edited ? "Send edited reply" : "Send"}
        </RoleButton>
        {editing ? (
          <RoleButton
            need="team_performance.manage"
            size="sm"
            variant="outline"
            disabled={!edited || actions.busy !== null}
            onClick={() => void actions.run("edit", () => editDraft(id, body)).then((ok) => ok && setEditing(false))}
          >
            Save edit
          </RoleButton>
        ) : (
          <RoleGate need="team_performance.manage">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <PencilLine aria-hidden /> Edit
            </Button>
          </RoleGate>
        )}
        {secondary}
        {!verdict.allowed ? (
          <span className="text-xs text-destructive">
            {verdict.blockers.length === 1 ? "1 guardrail blocks sending" : `${verdict.blockers.length} guardrails block sending`} — edit it or hand it off.
          </span>
        ) : null}
      </div>
      {noteBox}
    </div>
  );
}
