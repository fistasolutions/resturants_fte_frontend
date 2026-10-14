/**
 * The Style Guide's prompt panel and test bench (frontend SPEC-297 / backend SPEC-292).
 *
 * Pure half: the two surfaces, the provenance line under the prompt, and the rules for a
 * bench that keeps five renders. The components stay presentational.
 */

import { relativeTime } from "@/lib/system-trace";
import type { StylePrompt, StyleSurface, StyleTest } from "@/types/brand-brain";

/** The bench keeps five (backend prunes to the same number — owner, 2026-09-23). */
export const MAX_TESTS = 5;

export const SURFACES: readonly { key: StyleSurface; label: string; hint: string }[] = [
  { key: "social", label: "Social", hint: "Instagram and the carousels — 4:5" },
  { key: "hero", label: "Blog hero", hint: "The article banner — cropped to a wide 2:1" },
] as const;

export function surfaceLabel(surface: StyleSurface): string {
  return SURFACES.find((s) => s.key === surface)?.label ?? "Social";
}

/** "21 rules · 3,998 characters · safety last" — what sits under the prompt.
 *
 * While the owner is typing (SPEC-298) it counts what is on screen and says so, because
 * the number that matters is the one about to be saved. */
export function promptStats(preview: StylePrompt | undefined, typed?: string): string {
  if (!preview) return "";
  const dirty = typed !== undefined && isDirty(typed, preview);
  const chars = (dirty ? typed.trim().length : preview.chars).toLocaleString();
  if (dirty) return `${chars} characters · unsaved`;
  const rules = `${preview.rules} rule${preview.rules === 1 ? "" : "s"}`;
  const tail =
    preview.source === "custom"
      ? "your own prompt — the rules below are not composing it"
      : "appended to every image prompt, safety last";
  return `${rules} · ${chars} characters · ${tail}`;
}

/** Whether what is typed differs from the text in force (trailing space ignored). */
export function isDirty(typed: string, preview: StylePrompt | undefined): boolean {
  if (!preview) return false;
  return typed.trim() !== preview.prompt.trim();
}

/** "Custom · edited by mr@… 2h ago" / "From the rules". */
export function promptSourceLabel(preview: StylePrompt | undefined, now = new Date()): string {
  if (!preview) return "";
  if (preview.source !== "custom") return "From the rules";
  const who = preview.updated_by ? ` by ${preview.updated_by}` : "";
  const when = preview.updated_at ? ` · ${relativeTime(preview.updated_at, now)}` : "";
  return `Custom${who}${when}`;
}

/** The warning under an edited prompt: which safety rules it no longer mentions. */
export function missingSafetyLine(labels: string[]): string {
  if (labels.length === 0) return "";
  const list = labels.length <= 3 ? labels.join(", ") : `${labels.slice(0, 3).join(", ")} and ${labels.length - 3} more`;
  return `This prompt does not mention ${list} — pictures will be generated without ${labels.length === 1 ? "that rule" : "those rules"}.`;
}

/** The section counts, in the backend's order, as a readable line. */
export function sectionLine(preview: StylePrompt | undefined): string {
  if (!preview || preview.sections.length === 0) return "";
  const order = ["palette", "light", "composition", "styling", "typography", "layout", "safety"];
  return preview.sections
    .slice()
    .sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section))
    .map((s) => `${s.section} ${s.count}`)
    .join(" · ");
}

/** A tile's caption: what it was asked for, or the product it used. */
export function testCaption(test: StyleTest): string {
  const brief = (test.brief ?? "").trim();
  if (brief) return brief;
  return test.productTitle ?? "No brief — the rules alone";
}

/** Newest first, never more than five — the client mirror of the backend's prune. */
export function withNewTest(tests: StyleTest[], test: StyleTest): StyleTest[] {
  return [test, ...tests.filter((t) => t.id !== test.id)].slice(0, MAX_TESTS);
}

export function canGenerate(busy: boolean): boolean {
  return !busy;
}
