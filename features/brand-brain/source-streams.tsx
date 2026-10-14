"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmPersona, isSourced } from "@/features/brand-brain/personas-view";
import { PendingFactRow } from "@/features/brand-brain/pending-fact-row";
import { useCan } from "@/hooks/use-can";
import { factHref, factSectionLabel } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { deleteVoiceSample, updateRule, updateVoiceRule } from "@/services/brand-brain-actions";
import type { BrandRule, VoiceRule, VoiceSample } from "@/types/brand-brain";
import type { Fact, Persona } from "@/types/spotlight";

const EMPTY = "px-1 py-6 text-center text-sm text-muted-foreground";

/** The facts one document taught (SPEC-274): pending rows decide here; approved rows link to their page. */
export function SourceFactsStream({ facts, onChanged }: { facts: Fact[]; onChanged: () => void }) {
  if (facts.length === 0) return <p className={EMPTY}>This item taught no facts.</p>;
  const pending = facts.filter((f) => f.status === "pending" || f.status === "conflict");
  const decided = facts.filter((f) => f.status !== "pending" && f.status !== "conflict");
  return (
    <div className="space-y-4">
      {pending.length ? (
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Waiting for you</p>
          <div className="divide-y divide-border">
            {pending.map((f) => (
              <PendingFactRow key={f.id ?? f.label} fact={f} onChanged={onChanged} />
            ))}
          </div>
        </div>
      ) : null}
      {decided.length ? (
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Decided</p>
          <ul className="divide-y divide-border">
            {decided.map((f) => (
              <li key={f.id ?? f.label} className={cn("py-2 text-sm", f.status === "rejected" && "opacity-60")}>
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                  <span>{factSectionLabel(f.section ?? "identity")}</span>
                  {f.sourceLocator ? <span>· {f.sourceLocator}</span> : null}
                  <span>· {f.status === "rejected" ? "rejected" : f.enabled === false ? "approved · switched off" : "approved"}</span>
                </p>
                {f.id != null ? (
                  <Link href={factHref(f.id)} className="font-medium underline-offset-2 hover:underline">
                    {f.label}
                  </Link>
                ) : (
                  <span className="font-medium">{f.label}</span>
                )}
                <p className={cn("text-[13px] text-foreground/90", f.status === "rejected" && "line-through")}>{f.value}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SourceSamplesStream({ samples, onChanged }: { samples: VoiceSample[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  if (samples.length === 0) return <p className={EMPTY}>No quoted copy was found in this item.</p>;
  return (
    <ul className="divide-y divide-border">
      {samples.map((s) => (
        <li key={s.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
          <p className="italic">“{s.text}”</p>
          <RoleGate need="brand_brain.manage">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 text-muted-foreground"
              disabled={busy === s.id}
              onClick={() => {
                setBusy(s.id);
                deleteVoiceSample(s.id).then(onChanged).finally(() => setBusy(null));
              }}
            >
              Remove
            </Button>
          </RoleGate>
        </li>
      ))}
    </ul>
  );
}

export function SourceRulesStream({ rules, voiceRules, onChanged }: { rules: BrandRule[]; voiceRules: VoiceRule[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const gate = useCan()("brand_brain.manage");
  if (rules.length === 0 && voiceRules.length === 0) return <p className={EMPTY}>No rules were found in this item.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Rules from a document arrive switched off — turn on the ones you want every writer to obey.</p>
      <ul className="divide-y divide-border">
        {rules.map((r) => (
          <li key={`r${r.id}`} className="flex items-start justify-between gap-3 py-2.5 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">{r.kind === "word_banned" ? "Never say" : r.kind === "word_required" ? "Say instead" : r.kind === "claim" ? "Claims" : "Calendar"}</p>
              <p className="font-medium">{r.label}</p>
              {r.detail ? <p className="text-[13px] text-muted-foreground">{r.detail}</p> : null}
            </div>
            <Switch
              checked={r.enabled}
              disabled={busy === `r${r.id}` || !gate.allowed}
              title={gate.reason ?? undefined}
              aria-label={`${r.label} on`}
              onCheckedChange={(on) => {
                setBusy(`r${r.id}`);
                updateRule(r.id, { enabled: on }).then(onChanged).finally(() => setBusy(null));
              }}
            />
          </li>
        ))}
        {voiceRules.map((r) => (
          <li key={`v${r.id}`} className="flex items-start justify-between gap-3 py-2.5 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Voice</p>
              <p className="font-medium">{r.title}</p>
              <p className="text-[13px] text-muted-foreground">{r.detail}</p>
            </div>
            <Switch
              checked={r.enabled}
              disabled={busy === `v${r.id}` || !gate.allowed}
              title={gate.reason ?? undefined}
              aria-label={`${r.title} on`}
              onCheckedChange={(on) => {
                setBusy(`v${r.id}`);
                updateVoiceRule(r.id, { enabled: on }).then(onChanged).finally(() => setBusy(null));
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SourcePersonasStream({ personas, onChanged }: { personas: Persona[]; onChanged: () => void }) {
  if (personas.length === 0) return <p className={EMPTY}>This item defined no audience persona.</p>;
  return (
    <ul className="divide-y divide-border">
      {personas.map((p) => (
        <li key={p.id} className="py-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            {p.name}
            {isSourced(p) ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden /> confirmed
              </span>
            ) : (
              <span className="text-[11px] font-medium text-warning">unconfirmed — hidden from the writers</span>
            )}
          </p>
          <p className="text-[13px] text-muted-foreground">{p.tagline}</p>
          <p className="mt-1 text-[13px]">{p.description}</p>
          {!isSourced(p) ? <ConfirmPersona persona={p} onChanged={onChanged} /> : null}
        </li>
      ))}
    </ul>
  );
}
