"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuilderDraft, TestKind } from "@/lib/email-builder";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

const TESTS: { kind: TestKind; label: string; detail: string }[] = [
  { kind: "subject", label: "Subject line", detail: "Two subject lines, split evenly; the winner is judged on sales caused, not opens." },
  { kind: "content", label: "Content", detail: "Two versions of the body." },
  { kind: "send_time", label: "Send time", detail: "Morning against evening, in each customer's timezone." },
  { kind: "none", label: "No test", detail: "One version to everyone." },
];

/** Step 5 — what to learn from the send. Variants run as clones of the campaign (the email
 * platform's own A/B screen is not in its API); the holdout is what proves the email caused
 * the sales. */
export function StepTest({ draft, recipients, onChange }: { draft: BuilderDraft; recipients: number; onChange: (patch: Partial<Pick<BuilderDraft, "testKind" | "holdoutPercent">>) => void }) {
  const holdout = Math.round((recipients * draft.holdoutPercent) / 100);
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Test</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TESTS.map((t) => (
            <label key={t.kind} className={cn("flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors", draft.testKind === t.kind ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
              <input type="radio" name="test" className="mt-1 accent-primary" checked={draft.testKind === t.kind} onChange={() => onChange({ testKind: t.kind })} />
              <span>
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-xs text-muted-foreground">{t.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="max-w-md space-y-1.5">
        <Label htmlFor="holdout">Holdout</Label>
        <div className="flex items-center gap-3">
          <input
            id="holdout"
            type="range"
            min={0}
            max={30}
            step={5}
            value={draft.holdoutPercent}
            onChange={(event) => onChange({ holdoutPercent: Number(event.target.value) })}
            className="w-full accent-primary"
          />
          <Input aria-label="Holdout percent" type="number" min={0} max={50} value={draft.holdoutPercent} onChange={(event) => onChange({ holdoutPercent: Math.max(0, Math.min(50, Number(event.target.value) || 0)) })} className="w-20" />
          <span className="text-sm">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {draft.holdoutPercent > 0
            ? `${formatNumber(holdout)} customers won't get it. Comparing what they buy with what recipients buy shows the sales the email really caused.`
            : "Without a holdout, results show only what the email platform attributes — not what the email caused."}
        </p>
      </div>
    </div>
  );
}
