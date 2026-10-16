import { describe, expect, it } from "vitest";

import { visibleItems } from "@/lib/disclosure";
import { hubChildren, isNavItemActive, isSidebarItemActive, itemsWithin, navItems, sidebarItems } from "@/lib/navigation";

describe("isNavItemActive", () => {
  it("matches the exact route", () => {
    expect(isNavItemActive("/brief", "/brief")).toBe(true);
  });

  it("matches sub-routes", () => {
    expect(isNavItemActive("/brief/overdue", "/brief")).toBe(true);
    expect(isNavItemActive("/brief/transfers", "/brief")).toBe(true);
    expect(isNavItemActive("/reports/history", "/reports")).toBe(true);
  });

  it("does not match an unrelated route with the same prefix", () => {
    expect(isNavItemActive("/briefing", "/brief")).toBe(false);
  });

  it("does not match a different section entirely", () => {
    expect(isNavItemActive("/dashboard", "/brief")).toBe(false);
  });
});

describe("the sidebar and its hubs (SPEC-290)", () => {
  it("draws Digital Employees and not the four employees it contains", () => {
    const titles = sidebarItems.map((item) => item.title);
    expect(titles).toContain("Digital Employees");
    for (const nested of ["Search Visibility", "Social Media Manager", "Paid Ads Manager", "Email Marketing Manager", "Customer Support Agent", "Report Builder"]) {
      expect(titles).not.toContain(nested);
    }
    expect(titles.indexOf("Digital Employees")).toBe(titles.indexOf("Chat with AI") + 1);
  });

  it("keeps the employees as destinations, entered through the hub", () => {
    const within = itemsWithin("/employees").map((item) => item.href);
    expect(within).toEqual(["/spotlight", "/social", "/ads", "/email-marketing", "/customer-support", "/data-manager", "/report-fte", "/ops-coach", "/reputation"]);
    for (const item of navItems) {
      if (item.within) expect(navItems.some((hub) => hub.href === item.within && !hub.within)).toBe(true);
    }
  });

  it("lights the hub row on its own route and inside any of its employees", () => {
    const hub = navItems.find((item) => item.href === "/employees")!;
    expect(isSidebarItemActive("/employees", hub)).toBe(true);
    expect(isSidebarItemActive("/spotlight", hub)).toBe(true);
    expect(isSidebarItemActive("/spotlight/brand-brain/facts/12", hub)).toBe(true);
    expect(isSidebarItemActive("/report-fte/composer", hub)).toBe(true);
    expect(isSidebarItemActive("/ads", hub)).toBe(true);
    expect(isSidebarItemActive("/email-marketing/campaigns/new", hub)).toBe(true);
    expect(isSidebarItemActive("/customer-support", hub)).toBe(true);
    // SPEC-296: Finance Oversight lives UNDER the hub, so the plain prefix match
    // lights the row — no `within` entry needed.
    expect(isSidebarItemActive("/employees/finance", hub)).toBe(true);
    expect(isSidebarItemActive("/employees/finance/bills/qbo-1", hub)).toBe(true);
    expect(isSidebarItemActive("/dashboard", hub)).toBe(false);
    const chat = navItems.find((item) => item.href === "/chat")!;
    expect(isSidebarItemActive("/spotlight", chat)).toBe(false);
  });
});

describe("the Digital Employees dropdown (SPEC-329)", () => {
  it("lists the nine employees in the hub's roster order", () => {
    expect(hubChildren("/employees").map((item) => [item.title, item.href])).toEqual([
      ["Search Visibility", "/spotlight"],
      ["Social Media Manager", "/social"],
      ["Paid Ads Manager", "/ads"],
      ["Email Marketing Manager", "/email-marketing"],
      ["Customer Support Agent", "/customer-support"],
      ["Data Manager", "/data-manager"],
      ["Accounts Payable", "/employees/finance"],
      ["Report Builder", "/report-fte"],
      ["Ops Coach", "/ops-coach"],
      ["Reputation Manager", "/reputation"],
    ]);
  });

  it("opens onto nothing for an ordinary row", () => {
    expect(hubChildren("/dashboard")).toEqual([]);
  });

  it("does not add Accounts Payable to navItems (one doc per entry)", () => {
    expect(navItems.some((item) => item.href === "/employees/finance")).toBe(false);
  });

  it("follows progressive disclosure: Finance stays hidden until QuickBooks is connected", () => {
    const nav = [{ key: "finance", visible: false, ready: true, reason: "not_connected" as const }];
    expect(visibleItems(hubChildren("/employees"), nav).map((item) => item.href)).not.toContain(
      "/employees/finance",
    );
  });

  it("leaves out an employee the member's role or workspace hides", () => {
    const nav = [
      { key: "finance", visible: false, ready: true, reason: "permission" as const },
      { key: "ads", visible: false, ready: true, reason: "feature" as const },
    ];
    expect(visibleItems(hubChildren("/employees"), nav).map((item) => item.href)).toEqual([
      "/spotlight",
      "/social",
      "/email-marketing",
      "/customer-support",
      "/data-manager",
      "/report-fte",
      "/ops-coach",
      "/reputation",
    ]);
  });

  it("shows Data Manager only to an organization with the feature (SPEC-374)", () => {
    const off = [{ key: "data-manager", visible: false, ready: true, reason: "feature" as const }];
    expect(visibleItems(hubChildren("/employees"), off).map((item) => item.href)).not.toContain("/data-manager");
    const on = [{ key: "data-manager", visible: true, ready: true, reason: null }];
    expect(visibleItems(hubChildren("/employees"), on).map((item) => item.href)).toContain("/data-manager");
  });

  it("hides nothing when the workspace says nothing", () => {
    expect(visibleItems(hubChildren("/employees"), null)).toHaveLength(10);
  });

  it("highlights only the employee being viewed", () => {
    const viewing = "/employees/finance/bills/qbo-1";
    const lit = hubChildren("/employees").filter((item) => isNavItemActive(viewing, item.href));
    expect(lit.map((item) => item.href)).toEqual(["/employees/finance"]);
  });
});
