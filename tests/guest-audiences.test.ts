import { describe, expect, it } from "vitest";

import { splitAudiences, syncNotice } from "@/lib/guest-audiences";
import type { GuestAudience } from "@/types/guest-audiences";

const row = (key: string): GuestAudience => ({
  key,
  name: key,
  description: "",
  size: 1,
  withEmail: 1,
  reachable: 1,
  syncedAt: null,
  syncedCount: null,
});

describe("guest audiences", () => {
  it("separates the branch audiences", () => {
    const { lifecycle, branches } = splitAudiences([row("guest-one-visit"), row("guest-branch-4"), row("guest-regulars")]);
    expect(lifecycle.map((r) => r.key)).toEqual(["guest-one-visit", "guest-regulars"]);
    expect(branches.map((r) => r.key)).toEqual(["guest-branch-4"]);
  });

  it("says what a sync did, and who still needs to subscribe", () => {
    const base = { key: "k", externalId: "L", written: 12, added: 3, removed: 1, size: 9, notSubscribed: 0 };
    expect(syncNotice("Regulars", base)).toBe("Regulars: 12 guests updated in Klaviyo · list now 9 (3 added, 1 removed).");
    expect(syncNotice("Regulars", { ...base, written: 1, notSubscribed: 1 })).toContain(
      "1 guest opted in on your site but not subscribed in Klaviyo",
    );
  });
});
