"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { RoleButton } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { highlightHits } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { checkVoice } from "@/services/brand-brain-actions";
import type { VoiceCheckResult } from "@/types/brand-brain";

const SAMPLE =
  "Discover our exclusive collection of must-have essentials! Perfect for anyone who refuses to compromise. Shop now for unbeatable prices!";

function scoreTone(score: number): string {
  return score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
}

/**
 * "Does this sound like us?" (SPEC-263). The deterministic findings come first
 * (banned words, wrong forms, exclamation marks, price claims — computed, not
 * judged); the Brand Voice Judge adds the score, a finding per rule and a rewrite.
 */
export function VoiceChecker({ hasRules, step }: { hasRules: boolean; step?: number }) {
  const [text, setText] = useState(SAMPLE);
  const [checked, setChecked] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceCheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(value = text) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError(null);
    setBusy(true);
    try {
      setResult(await checkVoice(trimmed));
      setChecked(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The check failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-0 self-start overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-muted/40 px-4 py-2.5">
        {step ? <span className="grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">{step}</span> : null}
        <p className="text-[13px] font-bold">Does this sound like us?</p>
        <p className="text-xs text-muted-foreground">paste any draft — a caption, a banner, a product line — and get a verdict</p>
      </div>
      <div className="space-y-3 p-5">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to check" className="min-h-28" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {hasRules ? "Scored against the voice rules and the guardrails." : "No voice rules yet — banned words and guardrails still apply."}
          </p>
          <RoleButton need="brand_brain.view" size="sm" disabled={busy || !text.trim()} onClick={() => void check()}>
            {busy ? "Checking…" : "Check voice"}
          </RoleButton>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        {result && checked ? (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold tracking-tight">
                <span className={cn("tabular-nums", scoreTone(result.score))}>{result.score}</span>
                <span className="text-sm font-normal text-muted-foreground"> / 100 on-voice</span>
              </p>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  result.verdict === "passes" ? "bg-success/10 text-success" : result.verdict === "revise" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive",
                )}
              >
                {result.verdict === "passes" ? "passes the gate" : result.verdict === "revise" ? "needs a revise" : "sent back to the writer"}
              </span>
            </div>
            <p className="rounded-lg border border-border px-3 py-2 text-sm leading-relaxed">
              {highlightHits(checked, result.hits).map((run, i) =>
                run.hit ? (
                  <mark key={i} className="rounded-sm bg-destructive/15 px-0.5 text-foreground">
                    {run.text}
                  </mark>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              )}
            </p>
            <ul className="space-y-1 text-xs">
              {result.hits.map((h, i) => (
                <li key={`h-${i}`} className="flex items-start gap-2 text-destructive">
                  <X className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {h.note}
                </li>
              ))}
              {result.hits.length === 0 ? (
                <li className="flex items-start gap-2 text-success">
                  <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden /> No banned words, wrong terms or price claims
                </li>
              ) : null}
              {result.findings.map((f, i) => (
                <li key={`f-${i}`} className={cn("flex items-start gap-2", f.ok ? "text-muted-foreground" : "text-warning")}>
                  {f.ok ? <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                  {f.text}
                </li>
              ))}
              {!result.judged ? (
                <li className="text-muted-foreground">
                  {hasRules
                    ? "The judge was unavailable — this score is the deterministic part only."
                    : "No voice rules yet, so this is the deterministic check only — derive the voice to get the full verdict."}
                </li>
              ) : null}
            </ul>
            {result.rewrite ? (
              <div className="rounded-lg border border-ai/30 bg-ai/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-ai">
                  <GlispIcon className="size-3.5" aria-hidden /> In the brand&apos;s voice
                </p>
                <p className="text-sm leading-relaxed">{result.rewrite}</p>
                <RoleButton
                  need="brand_brain.view"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setText(result.rewrite ?? "");
                    void check(result.rewrite ?? "");
                  }}
                >
                  Use the rewrite
                </RoleButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
