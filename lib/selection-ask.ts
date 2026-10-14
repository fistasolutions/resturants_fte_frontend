/**
 * Select anything, ask about it (SPEC-243): the rules behind the "Ask Glisp"
 * bubble that appears over a text selection — what counts as a selection worth
 * asking about, the question it sends, and where the bubble sits.
 *
 * Pure so it is unit-tested; `features/chat/selection-ask.tsx` only wires the
 * DOM events to these.
 */
import type { ChatPageContext } from "@/types/chat";

/** Backend ceiling for `context.selection`. */
export const SELECTION_MAX_CHARS = 500;
/** Anything shorter is a stray click, not a "this one". */
export const SELECTION_MIN_CHARS = 3;

/** The selection as sent: whitespace collapsed, trimmed, cut at the ceiling with
 * an ellipsis; null when there is nothing worth asking about. */
export function normaliseSelection(raw: string | null | undefined): string | null {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (text.length < SELECTION_MIN_CHARS) return null;
  if (text.length <= SELECTION_MAX_CHARS) return text;
  return `${text.slice(0, SELECTION_MAX_CHARS - 1).trimEnd()}…`;
}

/** The question sent into the drawer's thread. */
export function selectionQuestion(text: string): string {
  return `I highlighted this on the page: "${text}". What is it telling me, and what should I do about it?`;
}

/** The page context with the highlighted text attached; null stays null. */
export function withSelection(
  context: ChatPageContext | null,
  text: string,
): ChatPageContext | null {
  if (!context) return null;
  return { ...context, selection: text };
}

/** A selection inside an editable field or the Ask Glisp panel is not a "this one". */
export function isIgnoredSelectionTarget(
  tagName: string,
  isContentEditable: boolean,
  insideDialog: boolean,
): boolean {
  const tag = tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isContentEditable || insideDialog;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface BubblePlacement {
  top: number;
  left: number;
  /** Which side of the selection the bubble sits on. */
  side: "above" | "below";
}

export const BUBBLE_GUTTER = 8;

/**
 * Where the bubble goes, in viewport pixels: centred over the selection, above it
 * by default, below when there is no room above, clamped to an 8 px gutter.
 */
export function bubblePosition(
  selection: Rect,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number },
): BubblePlacement {
  const centre = selection.left + selection.width / 2;
  const left = Math.min(
    Math.max(BUBBLE_GUTTER, centre - bubble.width / 2),
    Math.max(BUBBLE_GUTTER, viewport.width - bubble.width - BUBBLE_GUTTER),
  );
  const above = selection.top - bubble.height - BUBBLE_GUTTER;
  if (above >= BUBBLE_GUTTER) return { top: above, left, side: "above" };
  const below = Math.min(
    selection.top + selection.height + BUBBLE_GUTTER,
    viewport.height - bubble.height - BUBBLE_GUTTER,
  );
  return { top: Math.max(BUBBLE_GUTTER, below), left, side: "below" };
}
