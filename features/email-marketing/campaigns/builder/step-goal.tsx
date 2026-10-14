"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOAL_ORDER, GOALS } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import type { BuilderDraft } from "@/lib/email-builder";
import type { CampaignGoal } from "@/types/email-marketing";

/** Step 1 — what the send is for. Choosing a goal fills in the audience, the offer and the
 * subject ideas the later steps start from. */
export function StepGoal({ draft, onGoal, onName }: { draft: BuilderDraft; onGoal: (goal: CampaignGoal) => void; onName: (name: string) => void }) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What is this campaign for?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {GOAL_ORDER.map((goal) => {
            const checked = draft.goal === goal;
            return (
              <label
                key={goal}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <input type="radio" name="goal" className="mt-1 accent-primary" checked={checked} onChange={() => onGoal(goal)} />
                <span>
                  <span className="block text-sm font-medium">{GOALS[goal].label}</span>
                  <span className="block text-xs text-muted-foreground">{GOALS[goal].detail}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="max-w-md space-y-1.5">
        <Label htmlFor="campaign-name">Campaign name</Label>
        <Input id="campaign-name" value={draft.name} onChange={(event) => onName(event.target.value)} />
        <p className="text-xs text-muted-foreground">Only you see the name; customers see the subject line.</p>
      </div>
    </div>
  );
}
