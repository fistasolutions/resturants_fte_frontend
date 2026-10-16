import { describe, expect, it } from "vitest";

import { START, orderReward, pointsStep, proved, rewardOptions, samePhone, sessionLive } from "@/lib/loyalty-online";
import type { LoyaltySession } from "@/types/restaurant-os";

const session: LoyaltySession = {
  token: "tok",
  expiresIn: 1800,
  points: 50,
  rewards: [
    { id: 2, name: "$20 off", points: 500, affordable: false },
    { id: 1, name: "Free soda", points: 30, affordable: true },
  ],
};

describe("points at online checkout (SPEC-399)", () => {
  it("compares phones by their digits", () => {
    expect(samePhone("(555) 123-4567", "555.123.4567")).toBe(true);
    expect(samePhone("555 123 4567", "555 123 4568")).toBe(false);
    expect(samePhone("", "")).toBe(false);
  });

  it("goes back to the start when the phone changes or the session ends", () => {
    const now = 1_000_000;
    const state = proved("(555) 123-4567", session, now);
    expect(state.phase === "proved" && state.expiresAt).toBe(now + 1_800_000);
    expect(pointsStep(state, "5551234567", now + 1000)).toBe(state);
    expect(pointsStep(state, "5550000000", now + 1000)).toEqual(START);
    expect(pointsStep(state, "5551234567", now + 1_800_000)).toEqual(START);
    expect(pointsStep({ phase: "code", phone: "555 123 4567" }, "5559999999", now)).toEqual(START);
    expect(sessionLive(now + 1, now)).toBe(true);
    expect(sessionLive(now, now)).toBe(false);
  });

  it("lists rewards cheapest first, the unaffordable ones disabled", () => {
    expect(rewardOptions(session)).toEqual([
      { id: 1, label: "Free soda · 30 points", disabled: false },
      { id: 2, label: "$20 off · 500 points (you have 50)", disabled: true },
    ]);
  });

  it("puts a reward on the order only from a live proven session", () => {
    const state = proved("5551234567", session, 0);
    expect(orderReward(state, 1)).toEqual({ rewardId: 1, loyaltyToken: "tok" });
    expect(orderReward(state, 2)).toEqual({ rewardId: null, loyaltyToken: null });
    expect(orderReward(state, null)).toEqual({ rewardId: null, loyaltyToken: null });
    expect(orderReward(START, 1)).toEqual({ rewardId: null, loyaltyToken: null });
  });
});
