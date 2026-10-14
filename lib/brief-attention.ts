/**
 * Pure presentation helpers for the dynamic attention block (SPEC-224).
 *
 * In `lib/` because this is the layer Vitest covers — the component stays
 * presentational and the rules that decide what a reader sees get real tests.
 */

import type { BriefAttention, BriefAttentionItem } from "@/types/brief";

export const DEFAULT_PRIMARY_LIMIT = 5;

/**
 * Split into what the page shows and what it collapses.
 *
 * Ranking is the backend's job (it holds the money); this only honours the cut.
 * Splitting client-side keeps the whole list one fetch away from the expander.
 */
export function splitAttention(data: BriefAttention): {
  primary: BriefAttentionItem[];
  extra: BriefAttentionItem[];
} {
  const limit = data.primary_limit ?? DEFAULT_PRIMARY_LIMIT;
  return { primary: data.items.slice(0, limit), extra: data.items.slice(limit) };
}

/**
 * The line under the section heading.
 *
 * Silence has to be distinguishable from breakage: without this an empty block
 * could mean "all clear" or "the checks crashed", and those are opposite messages.
 * A failure is named rather than folded into the fired count.
 */
export function checksSummary(data: BriefAttention): string {
  const run = data.checks_run;
  if (run === undefined) return "";
  const fired = data.checks_fired ?? data.items.length;
  const failed = data.checks_failed ?? 0;
  const base = `${fired} of ${run} checks fired`;
  return failed > 0 ? `${base} · ${failed} could not run` : base;
}

/** Source labels render uppercase; normalise here so the component cannot drift. */
export function sourceLabel(source: string | undefined): string {
  return (source ?? "").trim().toUpperCase();
}

/**
 * Delta chips take the severity of the finding they sit on, not the sign of the
 * number they carry.
 *
 * Every card on this surface is a detector that FIRED, and a detector fires only
 * on a deterioration — so a falling number is bad news exactly as often as a
 * rising one. `store_conversion_drop` and `aov_drop` both fire on a fall, and
 * tinting "−15.6 pts" green put a reassuring chip on a destructive-red card.
 *
 * Outlined, never filled: a page carrying six filled red pills reads as a crisis
 * every morning, which is the exact failure this feature exists to fix.
 */
export function deltaToneClass(
  delta: string | undefined,
  status: "warn" | "error" = "error",
): string {
  if (!delta) return "";
  return status === "warn"
    ? "border-warning/40 text-warning"
    : "border-destructive/40 text-destructive";
}
