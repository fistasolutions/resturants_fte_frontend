"use client";

import { useState } from "react";
import { ChevronDown, ImageIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_DRAFT, draftFromPlan, draftProblems, hasDetails, type DraftProblems } from "@/lib/ci-plans";
import { cn } from "@/lib/utils";
import type { CiPlan, PlanDraft } from "@/types/ci-plans";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit when given, create otherwise. */
  initial?: CiPlan;
  /** Saves the draft (and the image when one was picked); rejects with the message to show. */
  onSubmit: (draft: PlanDraft, image: File | null) => Promise<void>;
}

/**
 * New / edit plan (SPEC-272 → SPEC-278 Patches) — the team's door, kept to three
 * boxes: title, why now, what you get. Two optional lines under them (in one line,
 * the value) and a collapsed Details row (where it lives, effort, an image). The
 * form mounts with the dialog so every open starts clean.
 */
export function PlanDialog({ open, onOpenChange, initial, onSubmit }: PlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <PlanForm initial={initial} onSubmit={onSubmit} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PlanForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: CiPlan;
  onSubmit: (draft: PlanDraft, image: File | null) => Promise<void>;
  onClose: () => void;
}) {
  const editing = initial !== undefined;
  const [draft, setDraft] = useState<PlanDraft>(() => (initial ? draftFromPlan(initial) : EMPTY_DRAFT));
  const [image, setImage] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(() => (initial ? hasDetails(draftFromPlan(initial), initial.hasImage) : false));

  const problems: DraftProblems = draftProblems(draft);
  const show = (field: keyof PlanDraft) => (touched ? problems[field] : undefined);

  function patch(next: Partial<PlanDraft>) {
    setDraft((current) => ({ ...current, ...next }));
    setServerError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (problems.effortDays) setDetails(true);
    if (Object.keys(problems).length > 0 || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(draft, image);
      onClose();
    } catch (failure) {
      setServerError(failure instanceof Error ? failure.message : "Saving the plan failed.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" data-plan-form>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle>
        <DialogDescription>Written by the team; the owner decides. Three boxes are the plan — the rest is optional.</DialogDescription>
      </DialogHeader>

      <Field id="plan-title" label="Title" error={show("title")}>
        <Input id="plan-title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Money pages — product & collection SEO" maxLength={200} aria-invalid={Boolean(show("title"))} />
      </Field>
      <Field id="plan-why" label="Why now" error={show("why")}>
        <Textarea id="plan-why" value={draft.why} onChange={(e) => patch({ why: e.target.value })} placeholder="The problem this solves, in his words." rows={3} maxLength={4000} aria-invalid={Boolean(show("why"))} />
      </Field>
      <Field id="plan-gets" label="What you get" hint="One per line, up to 12." error={show("gets")}>
        <Textarea id="plan-gets" value={draft.gets} onChange={(e) => patch({ gets: e.target.value })} placeholder={"Every page scored\nOne-click Optimise\nApprove & apply"} rows={4} aria-invalid={Boolean(show("gets"))} />
      </Field>
      <Field id="plan-memo" label="In one line" hint="Optional — left empty, the first line above is used.">
        <Input id="plan-memo" value={draft.memo} onChange={(e) => patch({ memo: e.target.value })} placeholder="What he gets, in one sentence." maxLength={2000} />
      </Field>
      <Field id="plan-value" label="The value" hint="Optional.">
        <Input id="plan-value" value={draft.value} onChange={(e) => patch({ value: e.target.value })} placeholder="What it is worth to the business." maxLength={2000} />
      </Field>

      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setDetails((open) => !open)}
          aria-expanded={details}
          aria-controls="plan-details"
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          data-plan-details-toggle
        >
          <span>Details</span>
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            Where it lives · effort · image
            <ChevronDown className={cn("size-4 transition-transform", details && "rotate-180")} aria-hidden />
          </span>
        </button>
        {details ? (
          <div id="plan-details" className="space-y-4 border-t border-border p-3">
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Field id="plan-where" label="Where it lives">
                <Input id="plan-where" value={draft.whereItLives} onChange={(e) => patch({ whereItLives: e.target.value })} placeholder="A new Search Visibility tab" maxLength={2000} />
              </Field>
              <Field id="plan-effort" label="Effort (days)" error={show("effortDays")}>
                <Input id="plan-effort" inputMode="decimal" value={draft.effortDays} onChange={(e) => patch({ effortDays: e.target.value })} placeholder="4" aria-invalid={Boolean(show("effortDays"))} />
              </Field>
            </div>
            <Field id="plan-image" label="What it looks like" hint={initial?.hasImage ? "A new image replaces the current one. PNG, JPEG or WebP, up to 5 MB." : "A mockup or screenshot. PNG, JPEG or WebP, up to 5 MB."}>
              <label
                htmlFor="plan-image"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm transition-colors hover:bg-accent/60",
                  image && "border-foreground/40",
                )}
              >
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{image ? image.name : "Choose an image…"}</span>
                {image ? (
                  <button type="button" onClick={(e) => { e.preventDefault(); setImage(null); }} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    Remove
                  </button>
                ) : null}
              </label>
              <input id="plan-image" type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </Field>
          </div>
        ) : null}
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Save plan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
