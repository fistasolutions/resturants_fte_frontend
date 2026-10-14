"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Playbook } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

type Draft = Omit<Playbook, "topic" | "updatedAt">;

const lines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function ListField({ id, label, hint, value, onChange }: { id: string; label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * A topic's playbook (SPEC-346): the steps, the data it must check, what it may offer, when it
 * must hand off and the tone — one item per line, so it reads like the instructions it is.
 */
export function PlaybookEditor({
  playbook,
  busy,
  onSave,
}: {
  playbook: Playbook;
  busy: boolean;
  onSave: (draft: Draft) => void;
}) {
  const id = useId();
  const [steps, setSteps] = useState(playbook.steps.join("\n"));
  const [mustCheck, setMustCheck] = useState(playbook.mustCheck.join("\n"));
  const [mayOffer, setMayOffer] = useState(playbook.mayOffer.join("\n"));
  const [handoffWhen, setHandoffWhen] = useState(playbook.handoffWhen.join("\n"));
  const [tone, setTone] = useState(playbook.tone);
  const draft: Draft = { steps: lines(steps), mustCheck: lines(mustCheck), mayOffer: lines(mayOffer), handoffWhen: lines(handoffWhen), tone: tone.trim() };
  const valid = draft.steps.length > 0 && draft.tone.length > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSave(draft);
      }}
    >
      <ListField id={`${id}-steps`} label="Steps" hint="One step per line, in order." value={steps} onChange={setSteps} />
      <ListField id={`${id}-check`} label="Data it must check" hint="It answers only after reading each of these." value={mustCheck} onChange={setMustCheck} />
      <ListField id={`${id}-offer`} label="What it may offer" hint="Every offer is still priced against the order's margin and your ceilings." value={mayOffer} onChange={setMayOffer} />
      <ListField id={`${id}-handoff`} label="Hand off when" hint="Any one of these sends the ticket to a person." value={handoffWhen} onChange={setHandoffWhen} />
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-tone`}>Tone</Label>
        <Input id={`${id}-tone`} value={tone} onChange={(event) => setTone(event.target.value)} />
        <p className="text-[11px] text-muted-foreground">Brand Brain’s voice and banned words apply on top, always.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={!valid || busy}>
          {busy ? "Saving…" : "Save playbook"}
        </Button>
        <span className="text-[11px] text-muted-foreground">Last saved {formatDateTime(playbook.updatedAt)}</span>
        {!valid ? <span className="text-xs text-destructive">A playbook needs at least one step and a tone.</span> : null}
      </div>
    </form>
  );
}
