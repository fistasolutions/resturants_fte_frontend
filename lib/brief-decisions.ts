/**
 * The Decisions panel's fold (SPEC-231 Patches).
 *
 * Mirrors `splitAttention`: the backend ranks decisions (SPEC-036 `_rank_decisions`),
 * this only honours a cut so eight decisions do not make the panel eight rows tall.
 * In `lib/` because it is the layer Vitest covers.
 */

import type { BriefDecision } from "@/types/brief";

export const DECISION_PRIMARY_LIMIT = 5;

export function splitDecisions(
  decisions: BriefDecision[],
  limit: number = DECISION_PRIMARY_LIMIT,
): { primary: BriefDecision[]; extra: BriefDecision[] } {
  return { primary: decisions.slice(0, limit), extra: decisions.slice(limit) };
}

/** "Show 3 more decisions" / "Show 1 more decision". */
export function moreDecisionsLabel(count: number): string {
  return `Show ${count} more decision${count === 1 ? "" : "s"}`;
}
