"use client";

import { useState } from "react";

import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useCan } from "@/hooks/use-can";
import { saveGuardrails, saveSender } from "@/services/email-marketing-actions";
import type { Guardrails, SenderDefaults } from "@/types/email-marketing";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Who emails come from, where replies go, and the seed list every send is tested on first. */
export function SenderCard({ sender, guardrails }: { sender: SenderDefaults; guardrails: Guardrails }) {
  const actions = useEmailMarketingActions();
  const can = useCan();
  // Saving writes the sender and the seed list, which is part of the guardrails (SPEC-358).
  const gate = can(["email_marketing.manage", "email_marketing.send"]);
  const [s, setS] = useState(sender);
  const [seeds, setSeeds] = useState(guardrails.seedList.join("\n"));
  const [requireTest, setRequireTest] = useState(guardrails.requireSeedTest);
  const seedList = seeds.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
  const invalid = [s.fromEmail, s.replyTo, ...seedList].filter((e) => !EMAIL.test(e));
  const problem = s.fromName.trim().length === 0 ? "Give a from-name." : invalid.length > 0 ? `Not an email address: ${invalid.join(", ")}` : seedList.length === 0 && requireTest ? "Add at least one seed address, or stop requiring a test." : null;

  return (
    <SettingsPanel
      title="Sender and seed list"
      description="The from-name and address customers see, and the inboxes every campaign is tested on first."
      footer={
        <>
          <p className={problem && gate.allowed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {gate.allowed ? (problem ?? actions.error ?? "The from-address must be on your verified sending domain.") : gate.reason}
          </p>
          <RoleButton
            need={["email_marketing.manage", "email_marketing.send"]}
            size="sm"
            className="ml-auto"
            disabled={problem !== null || actions.busy !== null}
            onClick={() => void actions.run("sender", async () => {
              await saveSender({ fromName: s.fromName.trim(), fromEmail: s.fromEmail.trim(), replyTo: s.replyTo.trim() });
              return saveGuardrails({ ...guardrails, seedList, requireSeedTest: requireTest });
            })}
          >
            Save
          </RoleButton>
        </>
      }
    >
      <fieldset disabled={!gate.allowed} className="grid min-w-0 gap-4 px-5 py-4 sm:grid-cols-3 sm:px-6">
        <div className="space-y-1.5"><Label htmlFor="s-name">From name</Label><Input id="s-name" value={s.fromName} onChange={(e) => setS({ ...s, fromName: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="s-email">From email</Label><Input id="s-email" type="email" value={s.fromEmail} onChange={(e) => setS({ ...s, fromEmail: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="s-reply">Reply-to</Label><Input id="s-reply" type="email" value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="s-seeds">Seed list — one address per line</Label><Textarea id="s-seeds" rows={3} value={seeds} onChange={(e) => setSeeds(e.target.value)} /></div>
        <label className="flex items-start gap-2 self-end text-sm">
          <input type="checkbox" className="mt-1 accent-primary" checked={requireTest} onChange={(e) => setRequireTest(e.target.checked)} />
          <span>Require a test send before every campaign</span>
        </label>
      </fieldset>
    </SettingsPanel>
  );
}
