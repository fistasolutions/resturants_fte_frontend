"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PRIORITIES,
  PRIORITY_META,
  handoffDecision,
  handoffSummaryValid,
  suggestHandoff,
} from "@/lib/customer-support";
import { can } from "@/lib/helpdesk-providers";
import type { Assignee, DraftReply, Handoff, Priority, SupportTicket, SupportWorkspace, TicketContext } from "@/types/customer-support";

function assigneeKey(to: Assignee): string {
  return `${to.kind}:${to.name}`;
}

function assigneeFrom(key: string): Assignee {
  const [kind, ...rest] = key.split(":");
  return { kind: kind === "team" ? "team" : "person", name: rest.join(":") };
}

/**
 * Hand-off as a first-class action (SPEC-346): to a team or a person, a three-line summary and
 * the next step as an internal note, and a priority — so a person never re-reads the thread.
 * The agent's suggestion fills every field; the owner can change any of them.
 */
export function HandoffDialog({
  open,
  onOpenChange,
  ticket,
  context,
  draft,
  workspace,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket;
  context: TicketContext;
  draft: DraftReply | null;
  workspace: SupportWorkspace;
  busy: boolean;
  onConfirm: (handoff: Omit<Handoff, "ticketId" | "at">) => void;
}) {
  const id = useId();
  const suggestion = suggestHandoff(ticket, context, workspace.guardrails, workspace.handoffMap);
  const decision = handoffDecision(ticket, draft, workspace.guardrails);
  const [to, setTo] = useState(assigneeKey(suggestion.to));
  const [summary, setSummary] = useState<string[]>([...suggestion.summary]);
  const [nextStep, setNextStep] = useState(suggestion.nextStep);
  const [priority, setPriority] = useState<Priority>(suggestion.priority);
  const teams = can(workspace.provider, "assignTeams") ? workspace.teams : [];
  const valid = handoffSummaryValid(summary) && nextStep.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hand off to a person</DialogTitle>
          <DialogDescription>
            Assigns the ticket, sets its priority and leaves this summary as an internal note in your helpdesk.
          </DialogDescription>
        </DialogHeader>
        {decision.handoff ? (
          <ul className="space-y-0.5 rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            {decision.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onConfirm({
              to: assigneeFrom(to),
              summary: [summary[0].trim(), summary[1].trim(), summary[2].trim()],
              nextStep: nextStep.trim(),
              priority,
              reason: decision.reasons[0] ?? "Handed off by the owner.",
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-to`}>Assign to</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger id={`${id}-to`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.length ? (
                    <SelectGroup>
                      <SelectLabel>Teams</SelectLabel>
                      {teams.map((team) => (
                        <SelectItem key={team} value={`team:${team}`}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  <SelectGroup>
                    <SelectLabel>People</SelectLabel>
                    {workspace.people.map((person) => (
                      <SelectItem key={person} value={`person:${person}`}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-priority`}>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger id={`${id}-priority`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Summary — three lines</legend>
            {summary.map((line, index) => (
              <Input
                key={index}
                aria-label={`Summary line ${index + 1}`}
                value={line}
                onChange={(event) => setSummary((current) => current.map((l, i) => (i === index ? event.target.value : l)))}
              />
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-next`}>Suggested next step</Label>
            <Input id={`${id}-next`} value={nextStep} onChange={(event) => setNextStep(event.target.value)} />
          </div>
          {!valid ? <p className="text-xs text-destructive">Each summary line and the next step need a few words.</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || busy}>
              {busy ? "Handing off…" : "Hand off"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
