import { describe, expect, it } from "vitest";

import {
  CONNECT_REASONS,
  connectReason,
  connectReasonCode,
  isConnectReason,
  withReason,
} from "@/lib/connect-reasons";

describe("connect refusal reasons (SPEC-336)", () => {
  it("knows exactly the three codes backend SPEC-344 refuses with", () => {
    expect(Object.keys(CONNECT_REASONS).sort()).toEqual([
      "connect_link_expired",
      "connect_link_invalid",
      "connect_started_elsewhere",
    ]);
  });

  it("reads the code off an action error, and nothing else", () => {
    expect(connectReasonCode({ code: "connect_link_expired", message: "x" })).toBe("connect_link_expired");
    expect(connectReasonCode({ code: "google_oauth_error" })).toBeNull();
    expect(connectReasonCode(new Error("boom"))).toBeNull();
    expect(connectReasonCode(null)).toBeNull();
    expect(connectReasonCode("connect_link_expired")).toBeNull();
  });

  it("renders a sentence only for a code we wrote", () => {
    expect(connectReason("connect_started_elsewhere")?.title).toMatch(/started somewhere else/);
    expect(connectReason("connect_link_expired")?.detail).toMatch(/10 minutes/);
    for (const value of [null, undefined, "", "constructor", "toString", "<script>", "google_oauth_error"]) {
      expect(connectReason(value)).toBeNull();
    }
    expect(isConnectReason("__proto__")).toBe(false);
  });

  it("adds the reason to a return link, keeping the query", () => {
    expect(withReason("/integrations/gsc?tab=settings&google=error", "connect_link_expired")).toBe(
      "/integrations/gsc?tab=settings&google=error&reason=connect_link_expired",
    );
    expect(withReason("/ads", "connect_link_invalid")).toBe("/ads?reason=connect_link_invalid");
    expect(withReason("/ads?tab=audit&meta=error", null)).toBe("/ads?tab=audit&meta=error");
  });
});
