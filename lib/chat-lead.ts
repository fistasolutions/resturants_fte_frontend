/**
 * Which block of a streamed reply gets the promoted opening line (SPEC-222).
 *
 * Pure and in `lib/` because this repo's Vitest runs node-only — logic that
 * needs a test cannot live inside the component.
 */

/** Tailwind for the promoted first paragraph. Tokens only (root Rule 9). */
export const LEAD_PARAGRAPH_CLASS =
  "[&>p:first-child]:mb-3 [&>p:first-child]:text-base [&>p:first-child]:font-medium [&>p:first-child]:leading-relaxed [&>p:first-child]:text-foreground";

/**
 * True for the block that carries the reply's opening sentence.
 *
 * While nothing has completed yet the tail holds it, so the tail is promoted
 * (`stableCount === 0`). Once the first block completes it owns the sentence
 * permanently — otherwise the promotion would jump down the reply as more
 * blocks arrived.
 */
export function isLeadBlock(index: number, stableCount: number): boolean {
  return index === 0 && stableCount > 0;
}

/** True when the live tail is still the only thing rendered. */
export function tailIsLead(stableCount: number): boolean {
  return stableCount === 0;
}
