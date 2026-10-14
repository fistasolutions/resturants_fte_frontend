"use client";

import { useId, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALWAYS_NEVER_AUTO_TOPICS, SENSITIVE_LABELS, SENSITIVE_ORDER, TOPIC_ORDER, topicLabel, withMandatory } from "@/lib/customer-support";
import type { Guardrails, SensitiveFlag, TopicKey, VipHandling } from "@/types/customer-support";

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
];

function toggle<T>(list: T[], value: T, on: boolean): T[] {
  return on ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(event) => onChange(Number.parseFloat(event.target.value))}
          className="w-28"
        />
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Validation the save button follows; the preview store refuses the same things. */
function problems(g: Guardrails): string[] {
  const out: string[] = [];
  const inRange = (v: number, lo: number, hi: number) => Number.isFinite(v) && v >= lo && v <= hi;
  if (!inRange(g.maxOfferPercent, 0, 100)) out.push("The offer ceiling is a percentage between 0 and 100.");
  if (!inRange(g.marginFloorPercent, 0, 100)) out.push("The margin floor is a percentage between 0 and 100.");
  if (!inRange(g.angerHandoff, 0, 1)) out.push("The anger line is between 0 and 100%.");
  if (!inRange(g.autopilotConfidence, 0, 1)) out.push("The confidence floor is between 0 and 100%.");
  if (!Number.isInteger(g.maxRepliesPerTicket) || g.maxRepliesPerTicket < 1) out.push("Allow at least one reply per ticket.");
  if (g.maxOfferAmount.amountMinor < 0 || g.vipThreshold.amountMinor < 0) out.push("Money values cannot be negative.");
  if (g.languages.length === 0) out.push("Keep at least one language.");
  if (!g.signOff.trim() || !g.signature.trim()) out.push("Add a sign-off and a signature.");
  return out;
}

/**
 * Settings → Guardrails (SPEC-346 §Safety): what is never answered automatically, when a
 * ticket goes to a person, the goodwill ceilings and margin floor, the autopilot confidence
 * floor, languages, and the sign-off. The words it may never use are Brand Brain's — edited
 * there, shown here, enforced by the same rulebook every writer uses.
 */
export function GuardrailsCard({ guardrails, busy, onSave }: { guardrails: Guardrails; busy: boolean; onSave: (g: Guardrails) => void }) {
  const id = useId();
  const [g, setG] = useState<Guardrails>(guardrails);
  const set = (patch: Partial<Guardrails>) => setG((current) => ({ ...current, ...patch }));
  const issues = problems(g);
  const dirty = JSON.stringify(g) !== JSON.stringify(guardrails);
  const currency = g.maxOfferAmount.currency;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (issues.length === 0) onSave(withMandatory(g));
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Never answered automatically</legend>
        <p className="text-[11px] text-muted-foreground">
          These always go to a person, whatever the topic’s autonomy. The sensitive subjects below and Wholesale cannot be switched off.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SENSITIVE_ORDER.map((flag: SensitiveFlag) => (
            <label key={flag} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked disabled aria-describedby={`${flag}-locked`} />
              <span className="text-foreground">{SENSITIVE_LABELS[flag]}</span>
              <span id={`${flag}-locked`} className="text-[11px]">always handled by a person</span>
            </label>
          ))}
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">Topics ({g.neverAuto.map(topicLabel).join(", ") || "none"})</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {TOPIC_ORDER.map((topic: TopicKey) => {
              const locked = ALWAYS_NEVER_AUTO_TOPICS.includes(topic);
              return (
                <label key={topic} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={locked || g.neverAuto.includes(topic)}
                    disabled={locked}
                    onCheckedChange={(on) => set({ neverAuto: toggle(g.neverAuto, topic, on === true) })}
                  />
                  {topicLabel(topic)}
                  {locked ? <span className="text-[11px] text-muted-foreground">always handled by a person</span> : null}
                </label>
              );
            })}
          </div>
        </details>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id={`${id}-anger`}
          label="Hand off when anger reaches"
          value={Math.round(g.angerHandoff * 100)}
          onChange={(v) => set({ angerHandoff: v / 100 })}
          min={0}
          max={100}
          suffix="%"
          hint="The classifier's anger score; at or above it, a person answers."
        />
        <NumberField
          id={`${id}-replies`}
          label="Agent replies per ticket"
          value={g.maxRepliesPerTicket}
          onChange={(v) => set({ maxRepliesPerTicket: v })}
          min={1}
          max={10}
          hint="After this many, the ticket goes to a person."
        />
        <NumberField
          id={`${id}-confidence`}
          label="Autopilot sends only above"
          value={Math.round(g.autopilotConfidence * 100)}
          onChange={(v) => set({ autopilotConfidence: v / 100 })}
          min={0}
          max={100}
          suffix="% confidence"
        />
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">VIP customers</legend>
          {(["human_reviewed", "always_human"] as VipHandling[]).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`${id}-vip`} checked={g.vipHandling === value} onChange={() => set({ vipHandling: value })} />
              {value === "always_human" ? "Always answered by a person" : "The agent drafts, a person reviews"}
            </label>
          ))}
          <div className="flex items-center gap-2 pt-1 text-sm">
            <Label htmlFor={`${id}-vip-from`} className="font-normal text-muted-foreground">
              VIP from
            </Label>
            <Input
              id={`${id}-vip-from`}
              type="number"
              min={0}
              className="w-28"
              value={g.vipThreshold.amountMinor / 100}
              onChange={(event) => set({ vipThreshold: { currency, amountMinor: Math.round(Number.parseFloat(event.target.value || "0") * 100) } })}
            />
            <span className="text-muted-foreground">{currency} lifetime</span>
          </div>
        </fieldset>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Goodwill</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField id={`${id}-offer-pct`} label="Up to" value={g.maxOfferPercent} onChange={(v) => set({ maxOfferPercent: v })} min={0} max={100} suffix="% of the order" />
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-offer-amt`}>and at most</Label>
            <div className="flex items-center gap-2">
              <Input
                id={`${id}-offer-amt`}
                type="number"
                min={0}
                className="w-28"
                value={g.maxOfferAmount.amountMinor / 100}
                onChange={(event) => set({ maxOfferAmount: { currency, amountMinor: Math.round(Number.parseFloat(event.target.value || "0") * 100) } })}
              />
              <span className="text-sm text-muted-foreground">{currency}</span>
            </div>
          </div>
          <NumberField
            id={`${id}-floor`}
            label="Keep at least"
            value={g.marginFloorPercent}
            onChange={(v) => set({ marginFloorPercent: v })}
            min={0}
            max={100}
            suffix="% margin"
            hint="Of the order total, after the offer."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Languages it may answer in</legend>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((lang) => (
            <label key={lang.code} className="flex items-center gap-2 text-sm">
              <Checkbox checked={g.languages.includes(lang.code)} onCheckedChange={(on) => set({ languages: toggle(g.languages, lang.code, on === true) })} />
              {lang.label}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">A ticket in any other language goes to a person.</p>
      </fieldset>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Words and claims it may never use</p>
        <ul className="flex flex-wrap gap-1.5">
          {g.bannedWords.map((word) => (
            <li key={word} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {word}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          From Brand Brain — the same rulebook every writer follows.{" "}
          <Link href="/spotlight/brand-brain/guardrails" prefetch={false} className="font-medium text-primary underline-offset-4 hover:underline">
            Edit them in Brand Brain
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-signoff`}>Sign-off</Label>
          <Input id={`${id}-signoff`} value={g.signOff} onChange={(event) => set({ signOff: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-signature`}>Signature</Label>
          <Input id={`${id}-signature`} value={g.signature} onChange={(event) => set({ signature: event.target.value })} />
        </div>
      </div>

      {issues.length ? (
        <ul className="space-y-0.5 text-xs text-destructive" role="alert">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!dirty || issues.length > 0 || busy}>
          {busy ? "Saving…" : "Save guardrails"}
        </Button>
        {dirty ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setG(guardrails)}>
            Discard
          </Button>
        ) : null}
      </div>
    </form>
  );
}
