"use client";

import { useState } from "react";

import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useCan } from "@/hooks/use-can";
import { hourLabel } from "@/lib/email-marketing";
import { saveGuardrails } from "@/services/email-marketing-actions";
import type { Audience, Guardrails } from "@/types/email-marketing";

function NumberField({ id, label, hint, value, min, max, onChange }: { id: string; label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))} className="w-36" />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** The guardrails (SPEC-345) — limits every send is checked against, by the owner's
 * approval and by autopilot alike. */
export function GuardrailsCard({ guardrails, audiences }: { guardrails: Guardrails; audiences: Audience[] }) {
  const actions = useEmailMarketingActions();
  const can = useCan();
  const gate = can(["email_marketing.manage", "email_marketing.send"]);
  const [g, setG] = useState<Guardrails>(guardrails);
  const set = (patch: Partial<Guardrails>) => setG((x) => ({ ...x, ...patch }));
  const dirty = JSON.stringify(g) !== JSON.stringify(guardrails);
  const groups = audiences.filter((a) => a.source === "fte" && (a.protective || a.key === "discount-only"));

  return (
    <SettingsPanel
      title="Guardrails"
      description="Every send — yours or the employee's — is checked against these before it can go."
      footer={
        <>
          <p className="text-xs text-muted-foreground">{gate.allowed ? (actions.error ?? (dirty ? "Unsaved changes." : "Saved.")) : gate.reason}</p>
          <RoleButton
            need={["email_marketing.manage", "email_marketing.send"]}
            size="sm"
            className="ml-auto"
            disabled={!dirty || actions.busy !== null}
            onClick={() => void actions.run("guardrails", () => saveGuardrails(g))}
          >
            Save guardrails
          </RoleButton>
        </>
      }
    >
      <fieldset disabled={!gate.allowed} className="grid min-w-0 gap-5 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <NumberField id="g-freq" label="Emails per person per week" hint="Anyone at the cap is left out of the next send." value={g.frequencyCapPerWeek} min={1} max={14} onChange={(v) => set({ frequencyCapPerWeek: v })} />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Quiet hours (customer&rsquo;s time)</p>
          <div className="flex items-center gap-2">
            <Input aria-label="Quiet hours start" type="number" min={0} max={23} value={g.quietHours.start} onChange={(e) => set({ quietHours: { ...g.quietHours, start: Math.max(0, Math.min(23, Number(e.target.value) || 0)) } })} className="w-20" />
            <span className="text-sm">to</span>
            <Input aria-label="Quiet hours end" type="number" min={0} max={23} value={g.quietHours.end} onChange={(e) => set({ quietHours: { ...g.quietHours, end: Math.max(0, Math.min(23, Number(e.target.value) || 0)) } })} className="w-20" />
          </div>
          <p className="text-xs text-muted-foreground">{hourLabel(g.quietHours.start)} to {hourLabel(g.quietHours.end)} — nothing lands then.</p>
        </div>
        <NumberField id="g-audience" label="Second approval above" hint="Recipients; above this you type the count to send." value={g.maxAudienceWithoutSecondApproval} min={100} max={1_000_000} onChange={(v) => set({ maxAudienceWithoutSecondApproval: v })} />
        <NumberField id="g-discount" label="Largest discount (%)" hint="A bigger code blocks the send." value={g.maxDiscountPercent} min={0} max={90} onChange={(v) => set({ maxDiscountPercent: v })} />
        <NumberField id="g-margin" label="Margin floor (%)" hint="A discount may not take a product's margin below this." value={g.marginFloorPercent} min={0} max={90} onChange={(v) => set({ marginFloorPercent: v })} />
        <NumberField id="g-ceiling" label="Daily send ceiling" hint="Most recipients in one day, across every send." value={g.dailySendCeiling} min={100} max={10_000_000} onChange={(v) => set({ dailySendCeiling: v })} />
        <fieldset className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <legend className="text-sm font-medium">Never send marketing to</legend>
          <div className="flex flex-wrap gap-2">
            {groups.map((a) => {
              const on = g.excludedSegments.includes(a.key);
              return (
                <label key={a.key} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                  <input type="checkbox" className="accent-primary" checked={on} onChange={() => set({ excludedSegments: on ? g.excludedSegments.filter((k) => k !== a.key) : [...g.excludedSegments, a.key] })} />
                  {a.name}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Unsubscribed, suppressed and complaining profiles are never sent marketing, whatever is ticked — the email platform enforces consent.</p>
        </fieldset>
      </fieldset>
    </SettingsPanel>
  );
}
