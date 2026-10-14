"use client";

import { useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";

import Link from "next/link";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCan } from "@/hooks/use-can";
import { rulesOfKind, wrongForms } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { addRule, deleteRule, setFactEnabled, updateRule } from "@/services/brand-brain-actions";
import type { BrandRule, RuleKind } from "@/types/brand-brain";
import type { Fact } from "@/types/spotlight";
import { formatDate } from "@/utils/format";

const LABEL = "text-[11px] font-medium tracking-wide text-muted-foreground uppercase";

function Header({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SwitchRow({
  title,
  detail,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  detail: string | null;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className={cn("flex items-start justify-between gap-3 px-5 py-3", !checked && "opacity-60")}>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {detail ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p> : null}
      </div>
      <Switch checked={checked} disabled={disabled} aria-label={`${title} — ${checked ? "on" : "off"}`} onCheckedChange={onChange} />
    </li>
  );
}

/**
 * Brand Brain → Guardrails (SPEC-263): the rules that gate output, as switches —
 * positioning guardrails (the brain's guardrail facts), the never-use and
 * always-say word lists, the claims policy, and the religious calendar the writer
 * plans around.
 */
export function GuardrailsView({ guardrails, rules, onChanged }: { guardrails: Fact[]; rules: BrandRule[]; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gate = useCan()("brand_brain.manage");
  const [banned, setBanned] = useState("");
  const [required, setRequired] = useState({ label: "", detail: "" });
  const [calendar, setCalendar] = useState({ label: "", detail: "", startsOn: "", endsOn: "" });

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setError(null);
    setBusy(true);
    try {
      await action();
      after?.();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  const chip = (r: BrandRule, kind: RuleKind) => (
    <span
      key={r.id}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
        kind === "word_banned" ? "border-destructive/30 text-destructive" : "border-success/30 text-success",
        !r.enabled && "opacity-50 line-through",
      )}
    >
      {r.label}
      {kind === "word_required" && wrongForms(r).length ? (
        <span className="text-muted-foreground">(not {wrongForms(r).join(", ")})</span>
      ) : null}
      <RoleGate need="brand_brain.manage">
        <button
          type="button"
          aria-label={`Remove ${r.label}`}
          disabled={busy}
          onClick={() => void run(() => deleteRule(r.id))}
          className="ml-0.5 rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden />
        </button>
      </RoleGate>
    </span>
  );

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-ai p-4">
        <p className="text-sm leading-relaxed">
          Guardrails <span className="font-semibold">gate</span> output: every writer receives the enabled rules with the
          brain, and the voice checker tests any text against them. Switch a rule off to pause it without losing it.
        </p>
      </Card>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {gate.reason ? <p className="text-xs text-muted-foreground">{gate.reason}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <Header title="Positioning rules" hint="from the onboarding document" />
          <ul className="divide-y divide-border">
            {guardrails.map((g) => (
              <SwitchRow
                key={g.id ?? g.label}
                title={g.label}
                detail={g.value}
                checked={g.enabled !== false}
                disabled={busy || g.id == null || !gate.allowed}
                onChange={(next) => void run(() => setFactEnabled(g.id!, next))}
              />
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 p-0">
            <Header title="Words" hint="type and press Enter" />
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className={cn(LABEL, "mb-2")}>Never use</p>
                <div className="flex flex-wrap gap-1.5">{rulesOfKind(rules, "word_banned").map((r) => chip(r, "word_banned"))}</div>
                <RoleGate need="brand_brain.manage">
                  <form
                    className="mt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const label = banned.trim();
                      if (!label) return;
                      void run(() => addRule({ kind: "word_banned", label }), () => setBanned(""));
                    }}
                  >
                    <Input value={banned} onChange={(e) => setBanned(e.target.value)} placeholder="add a banned word…" aria-label="Add a banned word" />
                  </form>
                </RoleGate>
              </div>
              <div>
                <p className={cn(LABEL, "mb-2")}>Always say it this way</p>
                <div className="flex flex-wrap gap-1.5">{rulesOfKind(rules, "word_required").map((r) => chip(r, "word_required"))}</div>
                <RoleGate need="brand_brain.manage">
                  <form
                    className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!required.label.trim() || !required.detail.trim()) return;
                      void run(
                        () => addRule({ kind: "word_required", label: required.label.trim(), detail: required.detail.trim() }),
                        () => setRequired({ label: "", detail: "" }),
                      );
                    }}
                  >
                    <Input value={required.label} onChange={(e) => setRequired((s) => ({ ...s, label: e.target.value }))} placeholder="the right form" aria-label="Required term" />
                    <Input value={required.detail} onChange={(e) => setRequired((s) => ({ ...s, detail: e.target.value }))} placeholder="wrong forms, comma-separated" aria-label="Wrong forms" />
                    <Button type="submit" size="sm" variant="outline" disabled={busy || !required.label.trim() || !required.detail.trim()}>
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                  </form>
                </RoleGate>
              </div>
            </div>
          </Card>

          <Card className="gap-0 p-0">
            <Header title="Claims policy" hint="what a claim in copy must be backed by" />
            <ul className="divide-y divide-border">
              {rulesOfKind(rules, "claim").map((r) => (
                <SwitchRow key={r.id} title={r.label} detail={r.detail} checked={r.enabled} disabled={busy || !gate.allowed} onChange={(enabled) => void run(() => updateRule(r.id, { enabled }))} />
              ))}
            </ul>
          </Card>

          {/* SPEC-295: the picture rules moved to their own tab — direction as well as
              prohibition — so the Guardrails tab is the brand's WORDS. */}
          <Card className="gap-0 p-0">
            <Header title="Picture rules" hint="now in the Style Guide" />
            <p className="px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              What a generated picture must and must not do — palette, light, composition,
              styling, type and brand safety — lives in the{" "}
              <Link href="/spotlight/brand-brain/style-guide" className="underline underline-offset-2">
                Style Guide
              </Link>
              .
            </p>
          </Card>

        </div>
      </div>

      <Card className="gap-0 p-0">
        <Header title="Religious calendar" hint="the writer plans around these; nothing goes out on the days marked quiet" />
        <ul className="divide-y divide-border">
          {rulesOfKind(rules, "calendar").map((r) => (
            <li key={r.id} className={cn("flex items-start justify-between gap-3 px-5 py-3", !r.enabled && "opacity-60")}>
              <div className="flex min-w-0 items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {r.label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                      {r.startsOn ? `${formatDate(r.startsOn)}${r.endsOn && r.endsOn !== r.startsOn ? ` – ${formatDate(r.endsOn)}` : ""}` : "recurring"}
                    </span>
                  </p>
                  {r.detail ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.detail}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch checked={r.enabled} disabled={busy || !gate.allowed} aria-label={`${r.label} — ${r.enabled ? "on" : "off"}`} onCheckedChange={(enabled) => void run(() => updateRule(r.id, { enabled }))} />
                <RoleGate need="brand_brain.manage">
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${r.label}`} disabled={busy} onClick={() => void run(() => deleteRule(r.id))}>
                    <X className="size-3.5 text-muted-foreground" aria-hidden />
                  </Button>
                </RoleGate>
              </div>
            </li>
          ))}
        </ul>
        <RoleGate need="brand_brain.manage">
          <form
            className="grid grid-cols-1 gap-2 border-t border-border px-5 py-3 sm:grid-cols-[1.2fr_1.6fr_auto_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const label = calendar.label.trim();
              if (!label) return;
              void run(
                () =>
                  addRule({
                    kind: "calendar",
                    label,
                    detail: calendar.detail.trim() || null,
                    startsOn: calendar.startsOn || null,
                    endsOn: calendar.endsOn || calendar.startsOn || null,
                  }),
                () => setCalendar({ label: "", detail: "", startsOn: "", endsOn: "" }),
              );
            }}
          >
            <Input value={calendar.label} onChange={(e) => setCalendar((s) => ({ ...s, label: e.target.value }))} placeholder="Day or season" aria-label="Calendar rule" />
            <Input value={calendar.detail} onChange={(e) => setCalendar((s) => ({ ...s, detail: e.target.value }))} placeholder="What the writer does about it" aria-label="Calendar detail" />
            <Input type="date" value={calendar.startsOn} onChange={(e) => setCalendar((s) => ({ ...s, startsOn: e.target.value }))} aria-label="Starts on" />
            <Input type="date" value={calendar.endsOn} onChange={(e) => setCalendar((s) => ({ ...s, endsOn: e.target.value }))} aria-label="Ends on" />
            <Button type="submit" size="sm" variant="outline" disabled={busy || !calendar.label.trim()}>
              <Plus className="size-3.5" aria-hidden /> Add
            </Button>
          </form>
        </RoleGate>
      </Card>
    </div>
  );
}
