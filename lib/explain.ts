/**
 * "Explain this" (SPEC-242): the question the ✦ button on a KPI card or verdict
 * tile sends to the Ask Glisp panel, and the `focus` line the backend renders into
 * the analyst's page-context block (backend SPEC-249).
 *
 * Pure — built from what the card shows, nothing fetched — so the question reads
 * naturally in history and the analyst is told exactly which card was pressed.
 */
import type { ChatPageContext } from "@/types/chat";
import { formatChange } from "@/utils/format";

/** The backend's `focus` ceiling. */
export const FOCUS_MAX_CHARS = 200;

export interface ExplainTarget {
  /** The card's label, as shown — "Revenue", "Catalogue health". */
  metric: string;
  /** The value, as shown — "$12,345", "Healthy", "—". */
  value: string;
  /** Signed % vs the comparison, when the card shows one. */
  delta?: number | null;
  /** The caption / comparison line, as shown — "vs previous period", "of revenue". */
  detail?: string | null;
}

function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** "+8.0%" / "−3.2%"; empty when the card shows no delta. */
export function deltaPhrase(delta: number | null | undefined): string {
  if (typeof delta !== "number" || !Number.isFinite(delta)) return "";
  return formatChange(delta).replace("-", "−");
}

/** The figure as the owner sees it — `$12,345, +8.0% vs previous period`. */
export function readingOf(target: ExplainTarget): string {
  const value = clean(target.value) || "—";
  const delta = deltaPhrase(target.delta);
  const detail = clean(target.detail);
  let reading = value;
  if (delta) reading += `, ${delta}`;
  if (detail) reading += delta ? ` ${detail}` : ` (${detail})`;
  return reading;
}

/** The question sent into the drawer's thread. */
export function explainQuestion(target: ExplainTarget): string {
  const metric = clean(target.metric) || "this";
  return `Explain the "${metric}" figure on this page — it reads ${readingOf(target)}. What is behind it, and what should I do about it?`;
}

/** The `focus` line: one line, ≤ 200 characters, the card as printed. */
export function explainFocus(target: ExplainTarget): string {
  const focus = `${clean(target.metric) || "Figure"} — ${readingOf(target)}`;
  if (focus.length <= FOCUS_MAX_CHARS) return focus;
  return `${focus.slice(0, FOCUS_MAX_CHARS - 1).trimEnd()}…`;
}

/** The page context with the pressed card attached; null stays null (the
 * question text still carries the figure, so the analyst is never blind). */
export function withFocus(
  context: ChatPageContext | null,
  target: ExplainTarget,
): ChatPageContext | null {
  if (!context) return null;
  return { ...context, focus: explainFocus(target) };
}

/** A question drafted into the composer by ✦, with the context it was drafted with. */
export interface ExplainDraft {
  question: string;
  context: ChatPageContext | null;
}

/**
 * Which context a panel send carries when a draft is pending: the draft's own
 * (with its `focus`) while the text is still the drafted question, the plain
 * page context once the owner has written something else.
 */
export function draftContextFor(
  draft: ExplainDraft | null,
  text: string,
  fallback: ChatPageContext | null,
): ChatPageContext | null {
  if (draft && text.trim() === draft.question.trim()) return draft.context;
  return fallback;
}
