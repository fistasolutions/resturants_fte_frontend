"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { voiceCheck } from "@/lib/email-marketing";
import type { VoiceRules } from "@/types/email-marketing";

/** The brand-voice check (SPEC-345), Brand Brain's rulebook model: banned words cap the
 * score, unsupported claims cost points. Checked on every word, as it is written. */
export function VoiceCheckCard({ text, rules }: { text: string; rules: VoiceRules }) {
  const check = voiceCheck(text, rules);
  const tone = check.banned.length > 0 ? "destructive" : check.score >= 70 ? "success" : "warning";
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Brand voice</p>
        <StatusBadge tone={tone}>{check.score}</StatusBadge>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {check.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground/80">Rules from your Brand Brain: {rules.voiceNotes.join(" ")}</p>
    </div>
  );
}
