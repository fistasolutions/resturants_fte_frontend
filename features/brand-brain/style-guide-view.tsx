"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import Link from "next/link";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StyleBench } from "@/features/brand-brain/style-bench";
import { StylePromptPanel } from "@/features/brand-brain/style-prompt";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { withNewTest } from "@/lib/style-bench";
import {
  groupStyleRules,
  kindForSection,
  styleSectionSummary,
  type StyleSectionSpec,
} from "@/lib/style-guide";
import { cn } from "@/lib/utils";
import {
  addRule,
  deleteRule,
  deleteStyleTest,
  resetStylePrompt,
  runStyleTest,
  saveStylePrompt,
  updateRule,
} from "@/services/brand-brain-actions";
import type { BrandRule, StyleSurface, StyleTest } from "@/types/brand-brain";

/**
 * Brand Brain → Style Guide (frontend SPEC-295, rebuilt by SPEC-297).
 *
 * Three things, in the order the owner asked for them: the **prompt** an image model is
 * actually sent, the **rules** that compile into it, and a **bench** that renders one
 * picture with today's rules and keeps the last five with their prompts. No explainer
 * paragraph — the prompt is the explanation.
 */
export function StyleGuideView({ rules, onChanged }: { rules: BrandRule[]; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { label: string; detail: string }>>({});
  // The store is remote: a write plus its refetch is a second or two. The switch shows
  // what was asked for while it saves, rather than snapping back until the list returns.
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [surface, setSurface] = useState<StyleSurface>("social");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [benchError, setBenchError] = useState<string | null>(null);
  const [tests, setTests] = useState<StyleTest[] | null>(null);
  // The prompt, the bench and the rules all write (SPEC-358): a role without the permission reads them.
  const gate = useCan()("brand_brain.manage");

  const preview = useApiQuery(brandBrainQueries.stylePrompt(surface));
  const stored = useApiQuery(brandBrainQueries.styleTests());
  const bench = tests ?? stored.data ?? [];

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setError(null);
    setBusy(true);
    try {
      await action();
      after?.();
      onChanged();
      void preview.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function savePrompt(text: string) {
    setPromptError(null);
    setSavingPrompt(true);
    try {
      await saveStylePrompt(surface, text);
      await preview.refetch();
    } catch (e) {
      setPromptError(e instanceof Error ? e.message : "Couldn't save the prompt — try again.");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function resetPrompt() {
    setPromptError(null);
    setSavingPrompt(true);
    try {
      await resetStylePrompt(surface);
      await preview.refetch();
    } catch (e) {
      setPromptError(e instanceof Error ? e.message : "Couldn't reset the prompt — try again.");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function generate(brief: string) {
    if (!gate.allowed) {
      setBenchError(gate.reason);
      return;
    }
    setBenchError(null);
    setRendering(true);
    try {
      const test = await runStyleTest({ brief: brief || undefined, surface });
      setTests((current) => withNewTest(current ?? stored.data ?? [], test));
    } catch (e) {
      setBenchError(e instanceof Error ? e.message : "The render failed — try again.");
    } finally {
      setRendering(false);
    }
  }

  async function remove(test: StyleTest) {
    if (!gate.allowed) {
      setBenchError(gate.reason);
      return;
    }
    setBenchError(null);
    const before = bench;
    setTests(before.filter((t) => t.id !== test.id));
    try {
      await deleteStyleTest(test.id);
    } catch (e) {
      setTests(before);
      setBenchError(e instanceof Error ? e.message : "Couldn't remove that one.");
    }
  }

  const sections = groupStyleRules(rules);
  const entry = (key: string) => draft[key] ?? { label: "", detail: "" };

  return (
    <div className="space-y-4">
      {gate.reason ? <p className="text-xs text-muted-foreground">{gate.reason}</p> : null}
      <StylePromptPanel
        preview={preview.data}
        surface={surface}
        onSurface={setSurface}
        loading={preview.isPending}
        saving={savingPrompt || !gate.allowed}
        error={promptError}
        onSave={(text) => void savePrompt(text)}
        onReset={() => void resetPrompt()}
      />

      <StyleBench
        tests={bench}
        surface={surface}
        busy={rendering}
        error={benchError}
        onGenerate={(brief) => void generate(brief)}
        onDelete={(test) => void remove(test)}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
        <h3 className="text-sm font-semibold">
          The rules
          {preview.data?.source === "custom" ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              not composing the {surface === "hero" ? "blog hero" : "social"} prompt while it
              is edited — reset it above to use them again
            </span>
          ) : null}
        </h3>
        <p className="text-xs text-muted-foreground">
          Words live in{" "}
          <Link href="/spotlight/brand-brain/guardrails" className="underline underline-offset-2">
            Guardrails
          </Link>
          .
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map(({ section, rules: rows }) => (
          <SectionCard
            key={section.key}
            section={section}
            rows={rows}
            busy={busy}
            pending={pending}
            draft={entry(section.key)}
            onDraft={(next) => setDraft((s) => ({ ...s, [section.key]: next }))}
            onToggle={(rule, enabled) => {
              setPending((s) => ({ ...s, [rule.id]: enabled }));
              void run(
                () => updateRule(rule.id, { enabled }),
                () =>
                  setPending((state) => {
                    const next = { ...state };
                    delete next[rule.id];
                    return next;
                  }),
              );
            }}
            onDelete={(rule) => void run(() => deleteRule(rule.id))}
            onAdd={(label, detail) =>
              void run(
                () =>
                  addRule({
                    kind: kindForSection(section.key),
                    section: section.key,
                    label,
                    detail,
                  }),
                () => setDraft((s) => ({ ...s, [section.key]: { label: "", detail: "" } })),
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  rows,
  busy,
  pending,
  draft,
  onDraft,
  onToggle,
  onDelete,
  onAdd,
}: {
  section: StyleSectionSpec;
  rows: BrandRule[];
  busy: boolean;
  pending: Record<number, boolean>;
  draft: { label: string; detail: string };
  onDraft: (next: { label: string; detail: string }) => void;
  onToggle: (rule: BrandRule, enabled: boolean) => void;
  onDelete: (rule: BrandRule) => void;
  onAdd: (label: string, detail: string) => void;
}) {
  const ready = draft.label.trim().length > 0 && draft.detail.trim().length > 0;
  const gate = useCan()("brand_brain.manage");
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="text-sm font-semibold">{section.label}</p>
        <p className="text-xs text-muted-foreground">
          {styleSectionSummary(rows.map((r) => ({ ...r, enabled: pending[r.id] ?? r.enabled })))}
        </p>
      </div>

      <ul className="divide-y divide-border">
        {rows.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-start justify-between gap-3 px-4 py-2.5",
              !(pending[rule.id] ?? rule.enabled) && "opacity-60",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{rule.label}</p>
              {rule.detail ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {rule.detail}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Switch
                checked={pending[rule.id] ?? rule.enabled}
                disabled={busy || !gate.allowed}
                title={gate.reason ?? undefined}
                aria-label={`${rule.label} — ${(pending[rule.id] ?? rule.enabled) ? "on" : "off"}`}
                onCheckedChange={(enabled) => onToggle(rule, enabled)}
              />
              <RoleGate need="brand_brain.manage">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  disabled={busy}
                  aria-label={`Delete ${rule.label}`}
                  onClick={() => onDelete(rule)}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </RoleGate>
            </div>
          </li>
        ))}
      </ul>

      <RoleGate need="brand_brain.manage">
        <form
          className="mt-auto grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-border px-4 py-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            onAdd(draft.label.trim(), draft.detail.trim());
          }}
        >
          <Input
            value={draft.label}
            onChange={(e) => onDraft({ ...draft, label: e.target.value })}
            placeholder="rule"
            aria-label={`${section.label} rule`}
            className="h-8"
          />
          <Input
            value={draft.detail}
            onChange={(e) => onDraft({ ...draft, detail: e.target.value })}
            placeholder="what a picture must do"
            aria-label={`${section.label} rule detail`}
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" className="h-8" disabled={busy || !ready}>
            <Plus className="size-3.5" aria-hidden />
          </Button>
        </form>
      </RoleGate>
    </Card>
  );
}
