/**
 * Using points at online checkout (frontend SPEC-399 / backend SPEC-419): where the guest is in the
 * three steps, when a proven session stops counting, and the rewards as the checkout lists them.
 * Points and what a reward is worth are always the backend's.
 */
import type { LoyaltySession } from "@/types/restaurant-os";

export type PointsState =
  | { phase: "ask" }
  | { phase: "code"; phone: string }
  | { phase: "proved"; phone: string; session: LoyaltySession; expiresAt: number };

export const START: PointsState = { phase: "ask" };

/** Two phones are the same when their digits are. */
export function samePhone(a: string, b: string): boolean {
  const digits = (v: string) => v.replace(/\D/g, "");
  return digits(a) !== "" && digits(a) === digits(b);
}

export function sessionLive(expiresAt: number, now: number): boolean {
  return now < expiresAt;
}

export function proved(phone: string, session: LoyaltySession, now: number): PointsState {
  return { phase: "proved", phone, session, expiresAt: now + session.expiresIn * 1000 };
}

/** The step to show: back to the start when the phone changed or the session ran out. */
export function pointsStep(state: PointsState, phone: string, now: number): PointsState {
  if (state.phase === "ask") return state;
  if (!samePhone(state.phone, phone)) return START;
  if (state.phase === "proved" && !sessionLive(state.expiresAt, now)) return START;
  return state;
}

export interface RewardOption {
  id: number;
  label: string;
  disabled: boolean;
}

/** Cheapest first; one the member cannot afford is listed but cannot be chosen. */
export function rewardOptions(session: LoyaltySession): RewardOption[] {
  return [...session.rewards]
    .sort((a, b) => a.points - b.points || a.id - b.id)
    .map((r) => ({
      id: r.id,
      label: `${r.name} · ${r.points} points${r.affordable ? "" : ` (you have ${session.points})`}`,
      disabled: !r.affordable,
    }));
}

/** What the order carries: a reward and its token only from a live, proven session. */
export function orderReward(state: PointsState, rewardId: number | null): { rewardId: number | null; loyaltyToken: string | null } {
  if (state.phase !== "proved" || rewardId === null) return { rewardId: null, loyaltyToken: null };
  const chosen = state.session.rewards.find((r) => r.id === rewardId);
  if (!chosen?.affordable) return { rewardId: null, loyaltyToken: null };
  return { rewardId, loyaltyToken: state.session.token };
}
