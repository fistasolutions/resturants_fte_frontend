"use client";

/**
 * The Brand Brain's editable rows (SPEC-111), shared by the v2 sub-tabs (SPEC-263):
 * a fact row that edits in place, the add-fact form, the persona card and its add
 * card, and the Confirm button. The old single-tab layout that composed them is gone —
 * `features/brand-brain/` owns the sections now.
 */

import { useState } from "react";
import { BadgeCheck, Ban, Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmBrandBrain,
  createFact,
  createPersona,
  deleteFact,
  deletePersona,
  updateFact,
  updatePersona,
} from "@/services/spotlight-actions";
import type { Fact, FactSection, Persona } from "@/types/spotlight";

import { ProvenanceChip } from "./provenance-chip";

/** A stored owner/manual fact — or an approved file fact (SPEC-263) — can be edited
 * or deleted; measured facts (no id) and research rows stay read-only (SPEC-111). */
export function factEditable(fact: Fact): boolean {
  return (
    fact.id != null &&
    (fact.source === "onboarding" || fact.source === "manual" || fact.source === "file") &&
    (fact.status ?? "approved") === "approved"
  );
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ── Read-only display rows (measured / non-editable) ─────────────────────── */

export function FactDisplay({ fact }: { fact: Fact }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{fact.label}</p>
        <p className="text-sm font-medium text-foreground">{fact.value}</p>
        {fact.sourceNote ? (
          <p className="mt-0.5 text-xs text-muted-foreground/80">{fact.sourceNote}</p>
        ) : null}
      </div>
      <ProvenanceChip source={fact.source} />
    </div>
  );
}

/* ── Editable fact row ─────────────────────────────────────────────────────── */

export function EditableFactRow({
  fact,
  onChanged,
  lockLabel = false,
  prohibited = false,
}: {
  fact: Fact;
  onChanged: () => void;
  /** Voice tone/avoid rows key off a fixed backend label — never rename them. */
  lockLabel?: boolean;
  prohibited?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(fact.label);
  const [value, setValue] = useState(fact.value);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  if (!factEditable(fact)) {
    return prohibited ? <VoiceDisplay fact={fact} prohibited /> : <FactDisplay fact={fact} />;
  }

  async function save() {
    const nextLabel = label.trim();
    const nextValue = value.trim();
    if ((!lockLabel && !nextLabel) || !nextValue) {
      setError("Label and value can't be empty.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const patch: { label?: string; value?: string } = {};
      if (!lockLabel && nextLabel !== fact.label) patch.label = nextLabel;
      if (nextValue !== fact.value) patch.value = nextValue;
      if (Object.keys(patch).length > 0) await updateFact(fact.id!, patch);
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    setRemoved(true);
    try {
      await deleteFact(fact.id!);
      onChanged();
    } catch (e) {
      setRemoved(false);
      setConfirming(false);
      setError(e instanceof Error ? e.message : "Couldn't delete — try again.");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setLabel(fact.label);
    setValue(fact.value);
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <div className="space-y-2 py-2">
        {!lockLabel ? (
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Fact label"
            maxLength={255}
            disabled={busy}
          />
        ) : (
          <p className="text-xs font-medium text-muted-foreground">{fact.label}</p>
        )}
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Fact value"
          maxLength={4000}
          disabled={busy}
          className="min-h-14"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-1.5">
          <Button size="sm" onClick={save} disabled={busy}>
            <Check className="size-3.5" aria-hidden />
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
            <X className="size-3.5" aria-hidden />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/row flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{fact.label}</p>
        <p className="text-sm font-medium text-foreground">{fact.value}</p>
        {fact.sourceNote ? (
          <p className="mt-0.5 text-xs text-muted-foreground/80">{fact.sourceNote}</p>
        ) : null}
        {error ? <p className="mt-0.5 text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ProvenanceChip source={fact.source} />
        {confirming ? (
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={remove}
              disabled={busy}
              aria-label="Confirm delete"
              className="text-destructive hover:text-destructive"
            >
              <Check className="size-3.5" aria-hidden />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={busy}
              aria-label="Cancel delete"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : (
          <RoleGate need="brand_brain.manage">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${fact.label}`}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${fact.label}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </RoleGate>
        )}
      </div>
    </div>
  );
}

/* ── Add-fact form ─────────────────────────────────────────────────────────── */

export function AddFactForm({
  section,
  onAdded,
  presetLabel,
}: {
  section: FactSection;
  onAdded: () => void;
  /** When set, the label is fixed (voice tone/avoid slots) and hidden. */
  presetLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(presetLabel ?? "");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const nextLabel = (presetLabel ?? label).trim();
    const nextValue = value.trim();
    if (!nextLabel || !nextValue) {
      setError("Label and value are required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await createFact({ section, label: nextLabel, value: nextValue });
      setLabel(presetLabel ?? "");
      setValue("");
      setOpen(false);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <RoleButton
        need="brand_brain.manage"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="mt-1"
      >
        <Plus className="size-3.5" aria-hidden />
        {presetLabel ? `Add ${presetLabel.toLowerCase()}` : "Add"}
      </RoleButton>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border p-2.5">
      {!presetLabel ? (
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          aria-label="New fact label"
          maxLength={255}
          disabled={busy}
        />
      ) : null}
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={presetLabel ? `${presetLabel}…` : "Value"}
        aria-label="New fact value"
        maxLength={4000}
        disabled={busy}
        className="min-h-14"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-1.5">
        <Button size="sm" onClick={submit} disabled={busy}>
          <Check className="size-3.5" aria-hidden />
          {busy ? "Adding…" : "Add"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ── Voice (fixed tone/avoid slots) ────────────────────────────────────────── */

function VoiceDisplay({ fact, prohibited }: { fact: Fact; prohibited?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {prohibited ? <Ban className="size-3.5" aria-hidden /> : null}
          {fact.label}
        </p>
        <ProvenanceChip source={fact.source} />
      </div>
      <p className="text-sm text-foreground">{fact.value}</p>
    </div>
  );
}

/* ── Personas ──────────────────────────────────────────────────────────────── */

function personaEditable(persona: Persona): boolean {
  return (
    persona.dbId != null &&
    (persona.source === "onboarding" || persona.source === "manual")
  );
}

export function EditablePersonaCard({
  persona,
  onChanged,
}: {
  persona: Persona;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(persona.name);
  const [role, setRole] = useState(persona.tagline);
  const [description, setDescription] = useState(persona.description);
  const [tags, setTags] = useState(persona.traits.join(", "));
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = personaEditable(persona);

  if (removed) return null;

  async function save() {
    if (!name.trim() || !role.trim() || !description.trim()) {
      setError("Name, role, and description are required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await updatePersona(persona.dbId!, {
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        tags: parseTags(tags),
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    setRemoved(true);
    try {
      await deletePersona(persona.dbId!);
      onChanged();
    } catch (e) {
      setRemoved(false);
      setConfirming(false);
      setError(e instanceof Error ? e.message : "Couldn't delete — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <Card className="gap-2 p-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Persona name"
          maxLength={255}
          disabled={busy}
        />
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Persona role"
          maxLength={255}
          disabled={busy}
          placeholder="Role / tagline"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Persona description"
          maxLength={4000}
          disabled={busy}
        />
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          aria-label="Persona tags (comma separated)"
          disabled={busy}
          placeholder="Tags, comma separated"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-1.5">
          <Button size="sm" onClick={save} disabled={busy}>
            <Check className="size-3.5" aria-hidden />
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setName(persona.name);
              setRole(persona.tagline);
              setDescription(persona.description);
              setTags(persona.traits.join(", "));
              setEditing(false);
              setError(null);
            }}
            disabled={busy}
          >
            <X className="size-3.5" aria-hidden />
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-base tracking-wide">{persona.name}</p>
          <p className="text-xs text-muted-foreground">{persona.tagline}</p>
        </div>
        <ProvenanceChip source={persona.source} />
      </div>
      <p className="text-sm text-muted-foreground">{persona.description}</p>
      {persona.traits.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {persona.traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center rounded-4xl border border-border px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
            >
              {trait}
            </span>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {editable ? (
        <div className="flex items-center gap-1.5">
          {confirming ? (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={remove}
                disabled={busy}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {busy ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          ) : (
            <RoleGate need="brand_brain.manage">
              <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setConfirming(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </Button>
            </RoleGate>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export function AddPersonaCard({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !role.trim() || !description.trim()) {
      setError("Name, role, and description are required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await createPersona({
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        tags: parseTags(tags),
      });
      setName("");
      setRole("");
      setDescription("");
      setTags("");
      setOpen(false);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Card className="items-center justify-center gap-2 border-dashed p-4">
        <RoleButton need="brand_brain.manage" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" aria-hidden />
          Add persona
        </RoleButton>
      </Card>
    );
  }

  return (
    <Card className="gap-2 p-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        aria-label="New persona name"
        maxLength={255}
        disabled={busy}
      />
      <Input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role / tagline"
        aria-label="New persona role"
        maxLength={255}
        disabled={busy}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        aria-label="New persona description"
        maxLength={4000}
        disabled={busy}
      />
      <Input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags, comma separated"
        aria-label="New persona tags"
        disabled={busy}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-1.5">
        <Button size="sm" onClick={submit} disabled={busy}>
          <Check className="size-3.5" aria-hidden />
          {busy ? "Adding…" : "Add persona"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </Button>
      </div>
    </Card>
  );
}

/* ── Confirm-now freshness button ──────────────────────────────────────────── */

export function ConfirmButton({ onConfirmed }: { onConfirmed: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await confirmBrandBrain();
      setDone(true);
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't confirm — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
        <Check className="size-3.5" aria-hidden />
        Confirmed just now
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <RoleButton need="brand_brain.manage" size="sm" onClick={confirm} disabled={busy}>
        <BadgeCheck className="size-3.5" aria-hidden />
        {busy ? "Confirming…" : "Confirm now"}
      </RoleButton>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/* ── Tab ───────────────────────────────────────────────────────────────────── */

