import { describe, expect, it } from "vitest";

import { destinationAfterSignIn } from "@/lib/auth-flows";
import {
  choosePlanHref,
  HOW_IT_STARTS,
  INCLUDED,
  onboardingPath,
  pickPlan,
  validPlanKey,
} from "@/lib/pricing";

const KEYS = ["up_to_3m", "3m_to_30m", "over_30m"];

describe("SPEC-320 plan keys", () => {
  it("accepts the backend's keys and refuses anything else", () => {
    expect(validPlanKey("3m_to_30m")).toBe("3m_to_30m");
    expect(validPlanKey(" OVER_30M ")).toBe("over_30m");
    expect(validPlanKey("")).toBeNull();
    expect(validPlanKey(null)).toBeNull();
    expect(validPlanKey("../admin")).toBeNull();
    expect(validPlanKey("a".repeat(33))).toBeNull();
  });
});

describe("where a chosen plan goes", () => {
  it("to sign-up for a visitor, to onboarding for someone signed in", () => {
    expect(choosePlanHref("up_to_3m", false)).toBe("/signup?plan=up_to_3m");
    expect(choosePlanHref("up_to_3m", true)).toBe("/onboarding?plan=up_to_3m");
  });

  it("onboarding carries only a valid plan", () => {
    expect(onboardingPath("over_30m")).toBe("/onboarding?plan=over_30m");
    expect(onboardingPath(null)).toBe("/onboarding");
    expect(onboardingPath("<script>")).toBe("/onboarding");
  });

  it("after sign-in, an account without an organization lands on onboarding with its plan", () => {
    expect(destinationAfterSignIn(false, null, "3m_to_30m")).toBe("/onboarding?plan=3m_to_30m");
    expect(destinationAfterSignIn(false, "/orders")).toBe("/onboarding");
    // With an organization the plan is irrelevant: the next page, or home.
    expect(destinationAfterSignIn(true, "/orders", "3m_to_30m")).toBe("/orders");
    expect(destinationAfterSignIn(true, null, "3m_to_30m")).toBe("/");
  });
});

describe("the plan to preselect", () => {
  it("prefers the URL, falls back to the remembered plan, ignores unknown ones", () => {
    expect(pickPlan("over_30m", "up_to_3m", KEYS)).toBe("over_30m");
    expect(pickPlan(null, "up_to_3m", KEYS)).toBe("up_to_3m");
    expect(pickPlan("gold", "up_to_3m", KEYS)).toBe("up_to_3m");
    expect(pickPlan("gold", "silver", KEYS)).toBeNull();
    expect(pickPlan(undefined, undefined, KEYS)).toBeNull();
  });
});

describe("the page's copy", () => {
  it("lists six inclusions and three steps, none empty", () => {
    expect(INCLUDED).toHaveLength(6);
    expect(HOW_IT_STARTS).toHaveLength(3);
    for (const item of [...INCLUDED, ...HOW_IT_STARTS]) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.body.length).toBeGreaterThan(0);
    }
  });

  it("never names a price (prices come from the backend)", () => {
    for (const item of [...INCLUDED, ...HOW_IT_STARTS]) {
      expect(`${item.title} ${item.body}`).not.toMatch(/\$\d/);
    }
  });
});

describe("SPEC-321 wording by payment mode", () => {
  it("says 'no card' only in the preview, and names Stripe when it is on", async () => {
    const { pricingChips, howItStarts } = await import("@/lib/pricing");
    expect(pricingChips(false)).toContain("No card needed to start");
    expect(pricingChips(true)).not.toContain("No card needed to start");
    expect(pricingChips(true)).toContain("Secure checkout by Stripe");
    expect(howItStarts(false)).toBe(HOW_IT_STARTS);
    expect(howItStarts(true)[1].title).toBe("Create your account and pay");
    expect(howItStarts(true)).toHaveLength(3);
  });
});

describe("what a plan includes (SPEC-351)", () => {
  it("says what AI is included without a dollar figure, and lists one set of inclusions", async () => {
    const { AI_INCLUDED, YOU_GET } = await import("@/lib/pricing");
    expect(AI_INCLUDED).not.toMatch(/[$€£]\s?\d/);
    expect(AI_INCLUDED).toMatch(/AI allowance/);
    expect(YOU_GET.length).toBeGreaterThan(0);
    expect(YOU_GET.join(" ")).not.toMatch(/[$€£]\s?\d/);
  });
});
