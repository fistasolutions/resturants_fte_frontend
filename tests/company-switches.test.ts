import { describe, expect, it } from "vitest";

import {
  PAGE_INTEGRATIONS,
  TAB_INTEGRATIONS,
  browseKeys,
  employeeUnit,
  listedItems,
  pageUnit,
  tabUnit,
  usedElsewhere,
} from "@/lib/company-switches";
import type { NavVisibility } from "@/lib/disclosure";
import { TAB_ROUTES, toVisibility, type ApiVisibility } from "@/lib/guided-view";

const API: ApiVisibility = {
  disclosure: "guided",
  pages: {
    orders: { visible: false, reason: "turned_off", needs: null },
    traffic: {
      visible: true,
      reason: "awaiting_connection",
      needs: { connection: "vcount", any_of: ["vcount", "clarity"], apps: ["vcount", "clarity"] },
    },
    warehouse: { visible: false, reason: "not_connected", needs: { connection: "ipacky", any_of: ["ipacky"], apps: ["ipacky"] } },
    "team-performance": { visible: true, reason: null, needs: null },
    results: { visible: false, reason: "no_data", needs: { action: "*" } },
    ai: { visible: false, reason: "guided_hidden", needs: null },
    returns: { visible: true, reason: null, needs: null },
    products: { visible: true, reason: null, needs: null },
    settings: { visible: true, reason: null, needs: null },
  },
  tabs: {
    products: {
      fit: { reason: "awaiting_connection", needs: { connection: "loop", any_of: ["loop"] } },
      catalog: { reason: "turned_off", needs: null },
    },
    returns: Object.fromEntries(
      ["overview", "by-style", "sizing", "categories", "fixes"].map((tab) => [
        tab,
        { reason: "not_connected", needs: { connection: "loop" } },
      ]),
    ),
    inventory: { transfers: { reason: "needs_locations", needs: { locations: 2 } } },
  },
  employees: [
    { key: "spotlight", active: true, needs: [], ready: true },
    { key: "finance", active: true, needs: ["quickbooks"], ready: false },
    { key: "support", active: false, needs: ["gorgias"], ready: true },
    { key: "customer_support", active: true, needs: ["gorgias"], ready: true },
  ],
  setup: [],
};
const V = toVisibility(API)!;

describe("a page's company switch", () => {
  it("reads on, waiting and off — and whether an owner may turn it on", () => {
    expect(pageUnit(V, "/orders", "Orders")).toMatchObject({ kind: "page", state: "off", switchable: true, note: "Turned off for everyone." });
    expect(pageUnit(V, "/traffic", "Store Traffic")).toMatchObject({
      state: "waiting",
      note: "Waiting for V-Count and Microsoft Clarity.",
      integrations: ["vcount", "clarity"],
    });
    expect(pageUnit(V, "/warehouse", "Warehouse")).toMatchObject({ state: "off", switchable: true, note: "Needs iPacky." });
    expect(pageUnit(V, "/results", "Results")).toMatchObject({
      state: "off",
      switchable: false,
      note: "Appears after your first action from the Morning Brief.",
    });
    expect(pageUnit(V, "/ai", "AI Performance")).toMatchObject({ switchable: true, note: "Tucked away in a new workspace." });
    expect(pageUnit(V, "/settings", "Settings")).toMatchObject({ kind: "locked", state: "on" });
    expect(pageUnit(V, "/employees/finance", "Accounts Payable")).toMatchObject({
      kind: "employee",
      unit: "finance",
      state: "waiting",
    });
  });

  it("reads a tab: waiting, turned off, needs a connection, or out of a switch's reach", () => {
    expect(tabUnit(V, "/products", "fit")).toMatchObject({ unit: "products:fit", state: "waiting", integrations: ["loop"] });
    expect(tabUnit(V, "/products", "catalog")).toMatchObject({ state: "off", switchable: true });
    expect(tabUnit(V, "/returns", "overview")).toMatchObject({ state: "off", switchable: true, note: "Needs Loop Returns." });
    expect(tabUnit(V, "/inventory", "transfers")).toMatchObject({ switchable: false });
    expect(tabUnit(V, "/products", "costs")).toMatchObject({ state: "on" });
  });

  it("reads an employee", () => {
    expect(employeeUnit(V, "support")).toMatchObject({ state: "off", switchable: true });
    expect(employeeUnit(V, "spotlight")).toMatchObject({ state: "on" });
  });
});

describe("what else uses an integration", () => {
  it("names the other pages, tabs and employees that read it, leaving out the one turned off", () => {
    expect(usedElsewhere(V, "gorgias", "team-performance")).toEqual(["Customer Support Agent"]);
    expect(usedElsewhere(V, "gorgias", "customer_support")).toEqual(["Team Performance"]);
    expect(usedElsewhere(V, "loop", "products:fit")).toEqual([]);
    expect(usedElsewhere(V, "loop", "returns")).toEqual(["Product Analyst → Fit"]);
  });

  it("knows every integration the backend gates on, tab by tab", () => {
    for (const [page, tabs] of Object.entries(TAB_INTEGRATIONS)) {
      const known = TAB_ROUTES[page]?.tabs.map((t) => t.key) ?? [];
      for (const tab of Object.keys(tabs)) expect(known, `${page}:${tab}`).toContain(tab);
    }
    expect(Object.keys(PAGE_INTEGRATIONS).sort()).toEqual(["team-performance", "traffic", "warehouse"]);
  });
});

describe("the rows Settings lists", () => {
  it("keep off pages a switch can bring back, and drop what the role cannot open", () => {
    const nav: NavVisibility[] = [
      { key: "orders", visible: false, ready: true, reason: "turned_off" },
      { key: "ai", visible: false, ready: true, reason: "permission" },
      { key: "dashboard", visible: true, ready: true, reason: null },
    ];
    const items = [{ href: "/orders" }, { href: "/ai" }, { href: "/dashboard" }, { href: "/docs" }];
    expect(listedItems(items, nav).map((i) => i.href)).toEqual(["/orders", "/dashboard", "/docs"]);
    expect(listedItems(items, null)).toEqual(items);
  });
});

describe("Browse apps", () => {
  it("lists only what a guided workspace uses, and every app otherwise", () => {
    const all = ["shopify", "gorgias", "loop", "gsc", "quickbooks"] as const;
    const guided = toVisibility({ ...API, integrations_shown: ["shopify", "google", "loop", "meta_ads"] });
    expect(browseKeys(guided, all)).toEqual(["shopify", "loop", "gsc"]);
    expect(browseKeys(toVisibility({ ...API, disclosure: "full" }), all)).toEqual([...all]);
    expect(browseKeys(null, all)).toEqual([...all]);
  });
});
