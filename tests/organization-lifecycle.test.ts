import { describe, expect, it } from "vitest";

import {
  EXPORT_PATH,
  confirmationMatches,
  exportHref,
  deletionFrom,
  plausibleRestoreToken,
  purgeDateLabel,
  restoreFailureMessage,
} from "@/lib/organization-lifecycle";

describe("leaving the platform (SPEC-332)", () => {
  it("downloads through the proxy", () => {
    expect(EXPORT_PATH).toBe("/api/proxy/organizations/current/export");
  });

  it("adds the files only when asked (SPEC-334)", () => {
    expect(exportHref(false)).toBe(EXPORT_PATH);
    expect(exportHref(true)).toBe(`${EXPORT_PATH}?files=true`);
  });

  it("matches the confirmation the way the backend does", () => {
    expect(confirmationMatches("  alpha   GOODS ", "Alpha Goods")).toBe(true);
    expect(confirmationMatches("Alpha Good", "Alpha Goods")).toBe(false);
    expect(confirmationMatches("   ", "")).toBe(false);
  });

  it("names the purge day, or says 'in 30 days' when it cannot", () => {
    expect(purgeDateLabel("2026-10-31T12:00:00Z")).toBe("31 October 2026");
    expect(purgeDateLabel("not a date")).toBe("in 30 days");
  });

  it("adapts the backend's answer", () => {
    expect(
      deletionFrom({ purge_after: "2026-10-31T12:00:00Z", restore_url: "u", emailed: false }),
    ).toEqual({ purgeAfter: "2026-10-31T12:00:00Z", restoreUrl: "u", emailed: false });
  });

  it("explains a failed restore by its code", () => {
    expect(restoreFailureMessage("restore_expired")).toMatch(/expired or was already used/);
    expect(restoreFailureMessage(null)).toMatch(/could not be restored/);
  });

  it("only sends a token of the backend's shape", () => {
    expect(plausibleRestoreToken("12.1793534400.abcdefghijklmnopqrstuvwxyz_-0123")).toBe(true);
    expect(plausibleRestoreToken("12.abc.sig")).toBe(false);
    expect(plausibleRestoreToken(undefined)).toBe(false);
    expect(plausibleRestoreToken("")).toBe(false);
  });
});
