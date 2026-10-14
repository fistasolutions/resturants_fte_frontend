"use client";

import { useState } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";

import { Panel, PanelRow } from "@/components/shared/panel";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REJECT_MIN_CHARS, decisionLine, noteProblem, rejectionProblems, rejectionValid } from "@/lib/ci-plans";
import { acceptPlan, PlanRequestError, rejectPlan, revertDecision } from "@/services/ci-plans-actions";
import type { CiPlan } from "@/types/ci-plans";
import { formatDate } from "@/utils/format";

type Mode = "verdict" | "choose" | "accept" | "reject";

interface ServerError {
  field: string | null;
  message: string;
}

/**
 * The end of every plan (SPEC-272 → SPEC-278): Yes or No, each with its words.
 * Yes opens an optional note — suggestions, conditions — and Submit; No opens
 * the two required boxes and Submit. A decided plan shows its verdict with Edit
 * decision, which brings the choice back with the current words in the boxes;
 * Submit replaces the decision (backend SPEC-276), Revert withdraws it and the
 * plan is awaiting again.
 */
export function PlanDecision({ plan, onDecided }: { plan: CiPlan; onDecided: () => void }) {
  const decided = plan.status !== "awaiting";
  const [mode, setMode] = useState<Mode>(decided ? "verdict" : "choose");
  const [note, setNote] = useState(plan.acceptNote ?? "");
  const [reason, setReason] = useState(plan.rejectReason ?? "");
  const [instead, setInstead] = useState(plan.rejectInstead ?? "");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [reverting, setReverting] = useState(false);

  const problems = rejectionProblems(reason, instead);
  const rejectOk = rejectionValid(reason, instead);
  const noteError = noteProblem(note);

  function leave(next: Mode) {
    setMode(next);
    setTouched(false);
    setServerError(null);
  }

  function startEdit() {
    // The current answer's words are already in the boxes; the choice comes back.
    setNote(plan.acceptNote ?? "");
    setReason(plan.rejectReason ?? "");
    setInstead(plan.rejectInstead ?? "");
    leave("choose");
  }

  async function submitAccept(event: React.FormEvent) {
    event.preventDefault();
    if (noteError || busy) return;
    setBusy(true);
    setServerError(null);
    try {
      await acceptPlan(plan.id, note);
      // The refetch remounts this panel on the new decision (keyed by the
      // reader) — the button reads "Saving…" until the verdict arrives.
      onDecided();
    } catch (failure) {
      setServerError({ field: null, message: failure instanceof Error ? failure.message : "Saving the decision failed." });
      setBusy(false);
    }
  }

  async function submitReject(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!rejectOk || busy) return;
    setBusy(true);
    setServerError(null);
    try {
      await rejectPlan(plan.id, reason, instead);
      onDecided();
    } catch (failure) {
      const field = failure instanceof PlanRequestError ? failure.field : null;
      setServerError({ field, message: failure instanceof Error ? failure.message : "Saving the decision failed." });
      setBusy(false);
    }
  }

  async function revert() {
    setBusy(true);
    setServerError(null);
    try {
      await revertDecision(plan.id);
      onDecided();
    } catch (failure) {
      setServerError({ field: null, message: failure instanceof Error ? failure.message : "Reverting the decision failed." });
      setBusy(false);
      setReverting(false);
    }
  }

  const reasonError = (touched && problems.reason) || (serverError?.field === "reason" ? serverError.message : null);
  const insteadError = (touched && problems.instead) || (serverError?.field === "instead" ? serverError.message : null);
  const generalError = serverError && serverError.field === null ? serverError.message : null;

  return (
    <Panel
      title="Your decision"
      aside={mode === "verdict" ? <span>{decisionLine(plan, formatDate)}</span> : null}
      className="border-foreground/20"
    >
      {mode === "verdict" ? (
        <Verdict plan={plan} onEdit={startEdit} />
      ) : mode === "choose" ? (
        <PanelRow>
          <p className="text-sm text-muted-foreground" data-plan-decision>
            {decided
              ? "Change your answer — keep the verdict and edit the words, or flip it. Submit replaces the earlier decision."
              : "Accept and it goes into the build queue — add any suggestions or conditions. Reject and tell us why and how it should look instead; the next version is built from your words."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RoleButton need="ci.manage" onClick={() => leave("accept")} className="bg-success text-success-foreground hover:bg-success/90" data-plan-yes>
              <Check className="size-4" aria-hidden /> Yes — build it
            </RoleButton>
            <RoleButton need="ci.manage" variant="outline" onClick={() => leave("reject")} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" data-plan-no>
              <X className="size-4" aria-hidden /> No — not like this
            </RoleButton>
            {decided ? (
              <>
                <Button variant="ghost" onClick={() => leave("verdict")} disabled={busy}>
                  Cancel
                </Button>
                <RoleButton
                  need="ci.manage"
                  variant="ghost"
                  onClick={() => setReverting(true)}
                  disabled={busy}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  data-plan-revert
                >
                  <RotateCcw className="size-3.5" aria-hidden /> Revert decision
                </RoleButton>
              </>
            ) : null}
          </div>
          {generalError ? (
            <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {generalError}
            </p>
          ) : null}
          <AlertDialog open={reverting} onOpenChange={(next) => !busy && setReverting(next)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revert this decision?</AlertDialogTitle>
                <AlertDialogDescription>
                  The plan goes back to awaiting a decision and the notes on it are cleared. The team can edit it again; you can decide it again any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void revert();
                  }}
                  disabled={busy}
                >
                  {busy ? "Reverting…" : "Revert"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PanelRow>
      ) : mode === "accept" ? (
        <PanelRow>
          <form onSubmit={submitAccept} className="space-y-3" data-plan-accept>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Check className="size-4 text-success" aria-hidden /> Yes — build it
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="accept-note">Any suggestions or conditions? (optional)</Label>
              <Textarea
                id="accept-note"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setServerError(null);
                }}
                rows={3}
                placeholder="Anything the team should keep in mind — what to add, what to leave out, when it should ship…"
                aria-invalid={Boolean(noteError)}
                aria-describedby={noteError ? "accept-note-error" : "accept-note-hint"}
              />
              {noteError ? (
                <p id="accept-note-error" className="text-xs text-destructive">
                  {noteError}
                </p>
              ) : (
                <p id="accept-note-hint" className="text-xs text-muted-foreground">
                  Saved with the plan and shown on its card. Leave it empty to just say yes.
                </p>
              )}
            </div>
            {generalError ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {generalError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || Boolean(noteError)} className="bg-success text-success-foreground hover:bg-success/90">
                {busy ? "Saving…" : "Submit"}
              </Button>
              <Button type="button" variant="outline" onClick={() => leave("choose")} disabled={busy}>
                Back
              </Button>
            </div>
          </form>
        </PanelRow>
      ) : (
        <PanelRow>
          <form onSubmit={submitReject} className="space-y-3" data-plan-reject>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <X className="size-4 text-destructive" aria-hidden /> No — not like this
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">
                Why not? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setServerError(null);
                }}
                rows={3}
                placeholder="What is wrong with this plan — timing, priority, the idea itself…"
                aria-invalid={Boolean(reasonError)}
                aria-describedby={reasonError ? "reject-reason-error" : undefined}
              />
              {reasonError ? (
                <p id="reject-reason-error" className="text-xs text-destructive">
                  {reasonError}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reject-instead">
                How should it look instead? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-instead"
                value={instead}
                onChange={(e) => {
                  setInstead(e.target.value);
                  setServerError(null);
                }}
                rows={3}
                placeholder="Describe what you want — where it lives, what it shows, what it must not do."
                aria-invalid={Boolean(insteadError)}
                aria-describedby={insteadError ? "reject-instead-error" : "reject-instead-hint"}
              />
              {insteadError ? (
                <p id="reject-instead-error" className="text-xs text-destructive">
                  {insteadError}
                </p>
              ) : (
                <p id="reject-instead-hint" className="text-xs text-muted-foreground">
                  Both are required — at least {REJECT_MIN_CHARS} characters each. Saved with the plan and shown on its card.
                </p>
              )}
            </div>
            {generalError ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {generalError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="destructive" disabled={!rejectOk || busy}>
                {busy ? "Saving…" : "Submit"}
              </Button>
              <Button type="button" variant="outline" onClick={() => leave("choose")} disabled={busy}>
                Back
              </Button>
            </div>
          </form>
        </PanelRow>
      )}
    </Panel>
  );
}

/** The recorded decision and its words, with the way back into the form. */
function Verdict({ plan, onEdit }: { plan: CiPlan; onEdit: () => void }) {
  const accepted = plan.status === "accepted";
  return (
    <PanelRow
      leading={
        accepted ? <Check className="size-4 text-success" aria-hidden /> : <X className="size-4 text-destructive" aria-hidden />
      }
      trailing={
        <RoleGate need="ci.manage">
          <Button variant="outline" size="sm" onClick={onEdit} data-plan-edit-decision>
            <Pencil className="size-3.5" aria-hidden /> Edit decision
          </Button>
        </RoleGate>
      }
    >
      <div className="space-y-1.5 text-sm leading-relaxed" data-plan-verdict={plan.status}>
        <p className="font-semibold">{accepted ? "Accepted — in the build queue" : "Rejected — the next version is built from these notes"}</p>
        {accepted ? (
          plan.acceptNote ? (
            <p>
              <span className="text-muted-foreground">Note:</span> {plan.acceptNote}
            </p>
          ) : (
            <p className="text-muted-foreground">No note — it will appear on Reports when it ships.</p>
          )
        ) : (
          <>
            <p>
              <span className="text-muted-foreground">Why not:</span> {plan.rejectReason}
            </p>
            <p>
              <span className="text-muted-foreground">Instead:</span> {plan.rejectInstead}
            </p>
          </>
        )}
      </div>
    </PanelRow>
  );
}
