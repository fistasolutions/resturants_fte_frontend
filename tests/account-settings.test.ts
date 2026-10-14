import { describe, expect, it } from "vitest";

import { nameProblem, passwordProblem, toOrganizationSettings, toSessions } from "@/lib/account-settings";

describe("account settings", () => {
  it("puts this device first, then the most recently active", () => {
    const sessions = toSessions([
      { id: "a", device: "Safari on iOS", browser: "Safari", os: "iOS", kind: "mobile", created_at: "2026-09-20T00:00:00Z", last_used_at: "2026-09-29T08:00:00Z", current: false },
      { id: "b", device: "Chrome on macOS", browser: "Chrome", os: "macOS", kind: "desktop", created_at: "2026-09-01T00:00:00Z", last_used_at: null, current: true },
      { id: "c", device: "Edge on Windows", browser: "Edge", os: "Windows", kind: "watch", created_at: "2026-09-10T00:00:00Z", last_used_at: "2026-09-25T00:00:00Z", current: false },
    ]);
    expect(sessions.map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(sessions[0].lastActiveAt).toBe("2026-09-01T00:00:00Z");
    expect(sessions[2].kind).toBe("desktop");
  });

  it("reads the organization's settings", () => {
    expect(toOrganizationSettings({ calendar_system: "hebrew", name: "Example Co.", slug: "example-co" })).toEqual({
      name: "Example Co.",
      slug: "example-co",
      calendar: "hebrew",
    });
    expect(toOrganizationSettings({ calendar_system: null, name: "X", slug: "x" }).calendar).toBe("gregorian");
  });

  it("checks a name the way the backend does", () => {
    expect(nameProblem("  Sam  ")).toBeNull();
    expect(nameProblem("   ")).toMatch(/Enter a name/);
    expect(nameProblem("x".repeat(121))).toMatch(/under 120/);
  });

  it("checks a new password and its confirmation", () => {
    expect(passwordProblem("short", "short")).toMatch(/at least 8/);
    expect(passwordProblem("long-enough", "different")).toMatch(/don't match/);
    expect(passwordProblem("long-enough", "long-enough")).toBeNull();
  });
});
