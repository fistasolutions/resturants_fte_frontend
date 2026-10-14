"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  INTENT_TEMPLATE_INTENTS,
  intentTemplateHasPlaceholder,
  queryIntentLabel,
} from "@/lib/spotlight";
import {
  createIntentTemplate,
  deleteIntentTemplate,
  updateIntentTemplate,
} from "@/services/spotlight-actions";
import type { IntentTemplate, Persona } from "@/types/spotlight";

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

/** Shared intent + persona pickers, reused by the add form and the edit row. */
function IntentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 sm:w-40" aria-label="Intent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INTENT_TEMPLATE_INTENTS.map((intent) => (
          <SelectItem key={intent} value={intent}>
            {queryIntentLabel(intent)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PersonaSelect({
  value,
  personas,
  onChange,
}: {
  value: string;
  personas: Persona[];
  onChange: (value: string) => void;
}) {
  // A stored persona may no longer exist (renamed/deleted) — keep it selectable
  // so an edit doesn't silently drop it.
  const names = personas.map((p) => p.name);
  const options = names.includes(value) || !value ? names : [value, ...names];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 sm:w-52" aria-label="Persona">
        <SelectValue placeholder="Persona" />
      </SelectTrigger>
      <SelectContent>
        {options.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TemplateRow({
  template,
  personas,
  onChanged,
}: {
  template: IntentTemplate;
  personas: Persona[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(template.template);
  const [intent, setIntent] = useState(template.intent);
  const [persona, setPersona] = useState(template.persona);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = intentTemplateHasPlaceholder(text) && persona.trim().length > 0;

  async function save() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await updateIntentTemplate(template.id, {
        template: text.trim(),
        intent,
        persona,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteIntentTemplate(template.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Search intent template"
          placeholder="{category} for work"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <IntentSelect value={intent} onChange={setIntent} />
          <PersonaSelect value={persona} personas={personas} onChange={setPersona} />
          <div className="flex gap-1 sm:ml-auto">
            <Button size="sm" onClick={save} disabled={busy || !valid}>
              <Check className="size-3.5" aria-hidden /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setText(template.template);
                setIntent(template.intent);
                setPersona(template.persona);
                setError(null);
              }}
              disabled={busy}
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
        {!intentTemplateHasPlaceholder(text) ? (
          <p className="text-xs text-warning">
            Include the {"{category}"} placeholder, e.g. “{"{category}"} for work”.
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{template.template}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn(pillBase, "bg-muted text-foreground")}>
            {queryIntentLabel(template.intent)}
          </span>
          <span className="text-xs text-muted-foreground">{template.persona}</span>
          {template.provenance === "default" ? (
            <span className={cn(pillBase, "bg-muted text-muted-foreground")}>
              Default
            </span>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <RoleGate need="brand_brain.manage">
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={busy}
            aria-label={`Edit: ${template.template}`}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={remove}
            disabled={busy}
            aria-label={`Delete: ${template.template}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </RoleGate>
    </div>
  );
}

function AddTemplateForm({
  personas,
  onAdded,
}: {
  personas: Persona[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [intent, setIntent] = useState<string>(INTENT_TEMPLATE_INTENTS[0]);
  const [persona, setPersona] = useState(personas[0]?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = intentTemplateHasPlaceholder(text) && persona.trim().length > 0;

  async function add() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await createIntentTemplate({ template: text.trim(), intent, persona });
      setText("");
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <RoleButton need="brand_brain.manage" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" aria-hidden /> Add search intent
      </RoleButton>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="New search intent template"
        placeholder="{category} for work"
        autoFocus
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <IntentSelect value={intent} onChange={setIntent} />
        <PersonaSelect value={persona} personas={personas} onChange={setPersona} />
        <div className="flex gap-1 sm:ml-auto">
          <Button size="sm" onClick={add} disabled={busy || !valid}>
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
          </Button>
        </div>
      </div>
      {!intentTemplateHasPlaceholder(text) && text.length > 0 ? (
        <p className="text-xs text-warning">
          Include the {"{category}"} placeholder.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The Brand Brain editor for the query bank's search-intent templates (SPEC-156).
 * Editing here changes what the query bank derives — a removed intent's rows are
 * pruned on the next rebuild (SPEC-125 reconcile), an added one produces new rows. */
export function IntentTemplatesEditor({
  templates,
  personas,
  onChanged,
}: {
  templates: IntentTemplate[];
  personas: Persona[];
  onChanged: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        The phrasing the query bank blankets each product category with. Use the{" "}
        {"{category}"} placeholder — it&apos;s filled with your real categories.
        Changes take effect the next time the query bank rebuilds.
      </p>
      <div className="space-y-1.5">
        {templates.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            personas={personas}
            onChanged={onChanged}
          />
        ))}
      </div>
      <AddTemplateForm personas={personas} onAdded={onChanged} />
    </div>
  );
}
