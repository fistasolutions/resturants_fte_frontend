import { describe, expect, it } from "vitest";

import {
  defaultProperty,
  describeSync,
  googleReturnState,
  humanSyncError,
  permissionLabel,
  propertyDisplay,
  syncPollInterval,
  syncProgress,
} from "@/lib/gsc-sync";
import type { GoogleProperty, GoogleSyncRun } from "@/types/spotlight";

function run(overrides: Partial<GoogleSyncRun>): GoogleSyncRun {
  return {
    state: "success",
    startedAt: "2026-09-16T07:00:00+00:00",
    finishedAt: "2026-09-16T07:00:09+00:00",
    records: 28,
    done: null,
    total: null,
    error: null,
    ...overrides,
  };
}

describe("googleReturnState (SPEC-250)", () => {
  it("accepts the three callback states and nothing else", () => {
    expect(googleReturnState("connected")).toBe("connected");
    expect(googleReturnState("error")).toBe("error");
    expect(googleReturnState("choose")).toBe("choose");
    expect(googleReturnState("anything")).toBeNull();
    expect(googleReturnState(undefined)).toBeNull();
  });
});

describe("permissionLabel", () => {
  it("names Google's levels in the owner's words", () => {
    expect(permissionLabel("siteOwner")).toBe("Owner");
    expect(permissionLabel("siteFullUser")).toBe("Full access");
    expect(permissionLabel("siteRestrictedUser")).toBe("Restricted access");
    expect(permissionLabel("siteUnverifiedUser")).toMatch(/Unverified/);
    expect(permissionLabel(null)).toBe("No access");
  });
});

describe("propertyDisplay", () => {
  it("tells domain properties from URL prefixes", () => {
    expect(propertyDisplay("sc-domain:examplestore.com")).toEqual({
      name: "examplestore.com",
      kind: "Domain property",
    });
    expect(propertyDisplay("https://www.examplestore.com/")).toEqual({
      name: "www.examplestore.com",
      kind: "URL prefix",
    });
    expect(propertyDisplay("https://examplestore.com/blogs/")).toEqual({
      name: "examplestore.com/blogs/",
      kind: "URL prefix",
    });
    expect(propertyDisplay("not a url").name).toBe("not a url");
  });
});

describe("syncProgress", () => {
  it("is empty unless a run is in flight", () => {
    expect(syncProgress(null)).toEqual({ percent: null, label: "" });
    expect(syncProgress(run({ state: "success" }))).toEqual({ percent: null, label: "" });
  });

  it("is indeterminate until the total is known, then counts pages", () => {
    expect(syncProgress(run({ state: "running", done: 0, total: null }))).toEqual({
      percent: null,
      label: "Starting…",
    });
    expect(syncProgress(run({ state: "running", done: 0, total: 0 }))).toEqual({
      percent: null,
      label: "Starting…",
    });
    expect(syncProgress(run({ state: "running", done: 3, total: 4 }))).toEqual({
      percent: 75,
      label: "3 of 4 pages",
    });
    expect(syncProgress(run({ state: "running", done: 1, total: 1 }))).toEqual({
      percent: 100,
      label: "1 of 1 page",
    });
  });

  it("never reports more done than total", () => {
    expect(syncProgress(run({ state: "running", done: 9, total: 4 })).percent).toBe(100);
  });
});

describe("describeSync", () => {
  it("distinguishes first sync from a re-sync", () => {
    expect(describeSync(run({ state: "running" }), null)?.headline).toBe("First sync");
    expect(describeSync(run({ state: "running" }), "2026-09-15")?.headline).toBe("Syncing");
  });

  it("reports rows on success and a plain reason on failure", () => {
    expect(describeSync(run({ records: 1 }), "2026-09-15")).toEqual({
      tone: "success",
      headline: "Synced",
      detail: "1 row of search data",
    });
    expect(describeSync(run({ state: "error", error: "no_property" }), null)).toEqual({
      tone: "error",
      headline: "Sync failed",
      detail: "No property was chosen when the sync ran.",
    });
    expect(
      describeSync(run({ state: "error", error: "cancelled — the run exceeded its time budget" }), null)
        ?.headline,
    ).toBe("Sync interrupted");
  });

  it("is null before any run and without a last pull", () => {
    expect(describeSync(null, null)).toBeNull();
    expect(describeSync(null, "2026-09-15")?.headline).toBe("Synced");
  });
});

describe("humanSyncError", () => {
  it("translates codes and passes messages through", () => {
    expect(humanSyncError(null)).toBe("The sync did not complete.");
    expect(humanSyncError("not_connected")).toMatch(/not connected/);
    expect(humanSyncError("Search Console unreachable: ConnectError")).toBe(
      "Search Console unreachable: ConnectError",
    );
  });
});

describe("syncPollInterval", () => {
  it("polls only while running", () => {
    expect(syncPollInterval(run({ state: "running" }))).toBe(2_000);
    expect(syncPollInterval(run({ state: "success" }))).toBe(false);
    expect(syncPollInterval(null)).toBe(false);
    expect(syncPollInterval(undefined)).toBe(false);
  });
});

describe("defaultProperty", () => {
  const rows: GoogleProperty[] = [
    { siteUrl: "https://www.circuleid.com/", permissionLevel: "siteOwner", selectable: true, recommended: false },
    { siteUrl: "sc-domain:examplestore.com", permissionLevel: "siteFullUser", selectable: true, recommended: true },
    { siteUrl: "sc-domain:ftes.ai", permissionLevel: "siteUnverifiedUser", selectable: false, recommended: false },
  ];

  it("keeps the stored property when it is still selectable", () => {
    expect(defaultProperty(rows, "https://www.circuleid.com/")).toBe("https://www.circuleid.com/");
  });

  it("falls back to the recommended one, never an unselectable one", () => {
    expect(defaultProperty(rows, null)).toBe("sc-domain:examplestore.com");
    expect(defaultProperty(rows, "sc-domain:ftes.ai")).toBe("sc-domain:examplestore.com");
  });

  it("selects nothing when there is no recommendation", () => {
    expect(defaultProperty(rows.filter((r) => !r.recommended), null)).toBeNull();
    expect(defaultProperty([], null)).toBeNull();
  });
});
