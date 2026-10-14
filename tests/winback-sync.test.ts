import { describe, expect, it } from "vitest";

import {
  KLAVIYO_SETTINGS_HREF,
  WINBACK_NOT_ALLOWED,
  refusedBySync,
  winbackCardCta,
  winbackSyncGate,
} from "@/lib/winback-sync";

const REASON =
  "Your Klaviyo key is read-only, so the win-back list can be reviewed here but not synced to Klaviyo. To sync it, give the key full access on Integrations.";

describe("winbackSyncGate", () => {
  it("allows when an older backend sends no access", () => {
    expect(winbackSyncGate(undefined)).toEqual({ allowed: true, reason: null });
    expect(winbackSyncGate(null)).toEqual({ allowed: true, reason: null });
  });

  it("allows a key that can sync", () => {
    expect(winbackSyncGate({ can_sync: true, reason: null })).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it("refuses with the backend's sentence", () => {
    expect(winbackSyncGate({ can_sync: false, reason: REASON })).toEqual({
      allowed: false,
      reason: REASON,
    });
  });
});

describe("refusedBySync", () => {
  it("recognises only the key's refusal", () => {
    expect(refusedBySync(WINBACK_NOT_ALLOWED)).toBe(true);
    expect(refusedBySync("winback_already_sent")).toBe(false);
    expect(refusedBySync(null)).toBe(false);
  });
});

describe("the Money Finder card (SPEC-356 patch)", () => {
  it("says Review list and how to connect when Klaviyo is not connected", () => {
    expect(winbackCardCta(false)).toEqual({
      label: "Review list",
      hint: { text: "Connect Klaviyo to sync", href: KLAVIYO_SETTINGS_HREF },
    });
  });

  it("stays as it was when connected or unknown", () => {
    for (const connected of [true, undefined]) {
      expect(winbackCardCta(connected)).toEqual({ label: "Review & sync to Klaviyo", hint: null });
    }
  });
});
