/** SPEC-183 — validation for the Performance Ads controls.
 *
 * Guards against operator slips on a page that configures money. The backend validates
 * independently; these just say so before the round trip. */
import { describe, expect, it } from "vitest";

import {
  isValid,
  validateCampaignDraft,
  validateMonthlyCap,
  type CampaignDraftInput,
} from "@/lib/ads-controls";

const GOOD: CampaignDraftInput = {
  name: "Fall dresses",
  channel: "meta",
  objective: "Conversions",
  persona: "The Modern Modest Woman",
  offer: "Fall dresses",
  dailyCap: "100",
  totalCap: "1000",
};

describe("validateCampaignDraft", () => {
  it("accepts a complete draft", () => {
    expect(isValid(validateCampaignDraft(GOOD))).toBe(true);
  });

  it("requires every descriptive field", () => {
    const errors = validateCampaignDraft({
      ...GOOD, name: "  ", objective: "", persona: "", offer: "",
    });
    expect(errors.name).toBeDefined();
    expect(errors.objective).toBeDefined();
    expect(errors.persona).toBeDefined();
    expect(errors.offer).toBeDefined();
  });

  it("rejects a zero daily cap — zero is not unlimited", () => {
    // The backend treats an unset daily cap as "may not spend", so a campaign created
    // with 0 could never run. Better to say so here than to create a dead campaign.
    expect(validateCampaignDraft({ ...GOOD, dailyCap: "0" }).dailyCap).toBeDefined();
  });

  it("rejects a negative daily cap and non-numeric input", () => {
    expect(validateCampaignDraft({ ...GOOD, dailyCap: "-5" }).dailyCap).toBeDefined();
    expect(validateCampaignDraft({ ...GOOD, dailyCap: "abc" }).dailyCap).toBeDefined();
  });

  it("rejects a total cap below the daily cap", () => {
    const errors = validateCampaignDraft({ ...GOOD, dailyCap: "500", totalCap: "100" });
    expect(errors.totalCap).toContain("cannot be lower");
  });

  it("allows a zero total cap (no lifetime ceiling)", () => {
    expect(isValid(validateCampaignDraft({ ...GOOD, totalCap: "0" }))).toBe(true);
  });

  it("rejects an unknown channel", () => {
    expect(validateCampaignDraft({ ...GOOD, channel: "tiktok" }).channel).toBeDefined();
  });
});

describe("validateMonthlyCap", () => {
  it("accepts a positive amount", () => {
    expect(validateMonthlyCap("5000")).toBeNull();
  });

  it("accepts zero — that means no store ceiling, not an error", () => {
    expect(validateMonthlyCap("0")).toBeNull();
  });

  it("rejects a negative cap and empty/garbage input", () => {
    expect(validateMonthlyCap("-1")).toBeTruthy();
    expect(validateMonthlyCap("")).toBeTruthy();
    expect(validateMonthlyCap("lots")).toBeTruthy();
  });
});
