import { describe, expect, it } from "vitest";

import { accessBanner, accessGate } from "@/lib/email-access";
import type { EmailAccess } from "@/types/email-marketing";

const READ_ONLY_REASON =
  "Your Klaviyo key is read-only, so the Email Marketing Manager can advise but not send. To let it prepare and send, give it a key with full access on Integrations.";

const readOnly: EmailAccess = {
  mode: "read_only",
  canSend: false,
  canBuildFlows: false,
  canSyncAudiences: false,
  missing: ["campaigns:write", "flows:write", "lists:write", "profiles:write", "segments:write", "templates:write"],
  reason: READ_ONLY_REASON,
  reasons: { send: READ_ONLY_REASON, flows: READ_ONLY_REASON, audiences: READ_ONLY_REASON },
};

const flowsMissing =
  "Your Klaviyo key is missing flows:write, so this is not possible yet. Add those permissions to the key on Integrations.";

const partial: EmailAccess = {
  mode: "partial",
  canSend: true,
  canBuildFlows: false,
  canSyncAudiences: true,
  missing: ["flows:write"],
  reason: flowsMissing,
  reasons: { send: null, flows: flowsMissing, audiences: null },
};

const full: EmailAccess = {
  mode: "full",
  canSend: true,
  canBuildFlows: true,
  canSyncAudiences: true,
  missing: [],
  reason: null,
  reasons: { send: null, flows: null, audiences: null },
};

describe("accessGate", () => {
  it("allows everything when an older backend sends no access", () => {
    for (const action of ["send", "flows", "audiences"] as const) {
      expect(accessGate(undefined, action)).toEqual({ allowed: true, reason: null });
      expect(accessGate(null, action)).toEqual({ allowed: true, reason: null });
    }
  });

  it("refuses every write on a read-only key with the backend's sentence", () => {
    for (const action of ["send", "flows", "audiences"] as const) {
      expect(accessGate(readOnly, action)).toEqual({ allowed: false, reason: READ_ONLY_REASON });
    }
  });

  it("refuses only what a partial key lacks", () => {
    expect(accessGate(partial, "send").allowed).toBe(true);
    expect(accessGate(partial, "audiences").allowed).toBe(true);
    expect(accessGate(partial, "flows")).toEqual({ allowed: false, reason: flowsMissing });
  });

  it("falls back to the whole-key sentence when an action has none", () => {
    const noPer = { ...readOnly, reasons: { send: null, flows: null, audiences: null } };
    expect(accessGate(noPer, "send")).toEqual({ allowed: false, reason: READ_ONLY_REASON });
  });

  it("allows everything on a full key", () => {
    for (const action of ["send", "flows", "audiences"] as const) {
      expect(accessGate(full, action).allowed).toBe(true);
    }
  });
});

describe("accessBanner", () => {
  it("is silent for a full key or an older backend", () => {
    expect(accessBanner(full)).toBeNull();
    expect(accessBanner(undefined)).toBeNull();
  });

  it("says read-only plainly", () => {
    expect(accessBanner(readOnly)?.title).toBe("Read-only Klaviyo key");
  });

  it("names the missing permissions on a partial key", () => {
    const banner = accessBanner(partial);
    expect(banner?.title).toBe("Some Klaviyo permissions are missing");
    expect(banner?.body).toContain("flows:write");
  });
});
