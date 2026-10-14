"use client";

import { SettingsPanel } from "@/features/settings/settings-panel";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useCan } from "@/hooks/use-can";
import { AUTONOMY, AUTONOMY_ORDER } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import { setAutonomy } from "@/services/email-marketing-actions";
import type { AutonomyLevel } from "@/types/email-marketing";

/** How much the employee may do on its own (SPEC-345). Each flow can override this on its
 * own page; autopilot only ever runs inside the guardrails. */
export function AutonomyCard({ level, overrides }: { level: AutonomyLevel; overrides: Record<string, AutonomyLevel> }) {
  const actions = useEmailMarketingActions();
  const can = useCan();
  const gate = can(["email_marketing.manage", "email_marketing.send"]);
  const overridden = Object.entries(overrides);
  return (
    <SettingsPanel title="Autonomy" description="How far the employee goes before it asks you.">
      <div className="space-y-3 px-5 py-4 sm:px-6">
        <div className="grid gap-2 md:grid-cols-2" role="radiogroup" aria-label="Autonomy level">
          {AUTONOMY_ORDER.map((a) => (
            <label key={a} className={cn("flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors", level === a ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
              <input type="radio" name="autonomy" className="mt-1 accent-primary" checked={level === a} disabled={actions.busy !== null || !gate.allowed} onChange={() => void actions.run("autonomy", () => setAutonomy(a))} />
              <span>
                <span className="block text-sm font-medium">{AUTONOMY[a].label}</span>
                <span className="block text-xs text-muted-foreground">{AUTONOMY[a].detail}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {overridden.length > 0
            ? `Overridden per program: ${overridden.map(([k, v]) => `${k.replace(/_/g, " ")} → ${AUTONOMY[v].label}`).join(" · ")}. Change these on each flow's page.`
            : "No program overrides. Set one on a flow's page."}
        </p>
        {!gate.allowed ? <p className="text-xs text-muted-foreground">{gate.reason}</p> : null}
        {actions.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
      </div>
    </SettingsPanel>
  );
}
