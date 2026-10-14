/**
 * Glisp in motion (SPEC-252) — the pure rules behind which state the mark shows
 * and how long a one-shot runs. The CSS in `globals.css` does the drawing.
 */

import type { GlispMotion, GlispState } from "@/components/shared/glisp-icon";

/** How long each one-shot plays before the caller clears it (ms, matches the CSS). */
export const GLISP_MOTION_MS: Record<GlispMotion, number> = {
  send: 600,
  pop: 700,
  nod: 600,
  shake: 360,
};

/** A reply is "just committed" when it finished in this session, not on a history
 * load — so the grounded pop never plays for old answers (root Rule 9). */
export const JUST_COMMITTED_MS = 5_000;

export function justCommitted(createdAt: string | null | undefined, now: number): boolean {
  if (!createdAt) return false;
  const at = Date.parse(createdAt);
  if (Number.isNaN(at)) return false;
  const age = now - at;
  return age >= 0 && age < JUST_COMMITTED_MS;
}

/** The header avatar: thinking while a reply is in flight, otherwise online. */
export function avatarState(thinking: boolean): GlispState {
  return thinking ? "thinking" : "online";
}
