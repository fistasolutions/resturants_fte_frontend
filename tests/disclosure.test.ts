import { describe, expect, it } from "vitest";

import { accessFor, visibleItems, type NavVisibility } from "@/lib/disclosure";

const NAV: NavVisibility[] = [
  { key: "dashboard", visible: true, ready: true, reason: null },
  { key: "orders", visible: false, ready: true, reason: "permission" },
  { key: "team-performance", visible: false, ready: true, reason: "not_connected" },
  { key: "ci", visible: false, ready: true, reason: "feature" },
  { key: "integrations", visible: true, ready: true, reason: null },
  { key: "finance", visible: false, ready: true, reason: "not_connected" },
];

const ITEMS = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Orders", href: "/orders" },
  { title: "Team Performance", href: "/team-performance" },
  { title: "Something new", href: "/something-new" },
];

describe("the sidebar", () => {
  it("draws only visible destinations, and never hides one the workspace does not name", () => {
    expect(visibleItems(ITEMS, NAV).map((i) => i.href)).toEqual(["/dashboard", "/something-new"]);
    expect(visibleItems(ITEMS, null)).toEqual(ITEMS);
  });
});

describe("a typed URL", () => {
  it("opens what the member may open", () => {
    expect(accessFor("/dashboard", NAV).allowed).toBe(true);
    expect(accessFor("/settings", NAV).allowed).toBe(true); // not named: never hidden
    expect(accessFor("/orders", null).allowed).toBe(true); // unreadable workspace hides nothing
  });

  it("answers a hidden page with its reason", () => {
    expect(accessFor("/orders/42", NAV)).toMatchObject({
      allowed: false,
      reason: "permission",
      title: "Orders isn't in your role",
      offerIntegrations: false,
    });
    expect(accessFor("/team-performance", NAV)).toMatchObject({
      reason: "not_connected",
      offerIntegrations: true,
    });
    expect(accessFor("/employees/finance/vendors", NAV).reason).toBe("not_connected");
    expect(accessFor("/ci/plans", NAV)).toMatchObject({
      reason: "feature",
      title: "This page isn't part of your workspace",
    });
  });

  it("offers Integrations only to a member who can open it", () => {
    const noIntegrations = NAV.map((n) => (n.key === "integrations" ? { ...n, visible: false } : n));
    expect(accessFor("/team-performance", noIntegrations).offerIntegrations).toBe(false);
  });
});
