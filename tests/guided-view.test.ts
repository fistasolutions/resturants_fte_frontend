import { describe, expect, it } from "vitest";

import { ADS_TAB_IDS, ADS_TAB_LABELS } from "@/lib/ads";
import { SUPPORT_TAB_IDS, SUPPORT_TAB_LABELS } from "@/lib/customer-support";
import { DISCOUNT_TABS } from "@/lib/discount-tabs";
import {
  CONNECTIONS,
  accessFor,
  visibleItems,
  integrationHref,
  integrationName,
  tabLockAccess,
  type NavVisibility,
} from "@/lib/disclosure";
import { EMAIL_TAB_IDS, EMAIL_TAB_LABELS } from "@/lib/email-marketing";
import { FORESIGHT_TABS } from "@/lib/foresight-tabs";
import { APPS, isIntegrationKey } from "@/lib/integration-catalog";
import { INVENTORY_TABS } from "@/lib/inventory-tabs";
import { PRODUCT_TABS } from "@/lib/product-tabs";
import { RETURNS_TAB_IDS, RETURNS_TAB_LABELS } from "@/lib/returns-tabs";
import { SPOTLIGHT_TAB_IDS, spotlightTabLabel } from "@/lib/spotlight";
import { TRAFFIC_TABS } from "@/lib/traffic-tabs";
import {
  TAB_ROUTES,
  firstOpenTab,
  guidedTabs,
  landingHref,
  lockedTabs,
  tabAccess,
  tabHref,
  tabInUrl,
  toVisibility,
  type ApiVisibility,
} from "@/lib/guided-view";
import { navPrefsTree } from "@/lib/nav-tab-registry";
import { guidedNavigation, toWorkspace } from "@/lib/workspace";

const loop = { reason: "not_connected", needs: { connection: "loop" } } as const;

/** A guided store with Shopify only (backend SPEC-366's answer, trimmed). */
const API: ApiVisibility = {
  disclosure: "guided",
  pages: {
    dashboard: { visible: true, reason: null, needs: null },
    returns: { visible: true, reason: null, needs: null },
    results: { visible: false, reason: "no_data", needs: { action: "*" } },
    traffic: { visible: false, reason: "no_data", needs: { connection: "vcount" } },
    social: { visible: false, reason: "inactive_employee", needs: { employee: "social" } },
    ai: { visible: false, reason: "guided_hidden", needs: null },
    integrations: { visible: true, reason: null, needs: null },
  },
  tabs: {
    products: { fit: loop },
    returns: { overview: loop, "by-style": loop, sizing: loop, categories: loop, fixes: loop },
    inventory: { transfers: { reason: "needs_locations", needs: { locations: 2 } } },
    discounts: { staff: { reason: "needs_pos", needs: { pos: true } } },
    foresight: { season: { reason: "calendar", needs: { calendar: "hebrew" } } },
    "email-marketing": { overview: { reason: "not_connected", needs: { connection: "klaviyo" } } },
  },
  employees: [{ key: "spotlight", active: true, needs: [], ready: true }],
  setup: [],
  integrations_shown: ["shopify"],
};

const V = toVisibility(API)!;
const none = new URLSearchParams();

describe("the copied lists", () => {
  const pairs = (tabs: readonly { key: string; label: string }[]) => tabs.map((t) => [t.key, t.label]);
  const fromIds = <K extends string>(ids: readonly K[], label: (k: K) => string) => ids.map((k) => [k, label(k)]);

  it("match each page's own tab bar, so a new or renamed tab fails here", () => {
    expect(pairs(TAB_ROUTES.products.tabs)).toEqual(pairs(PRODUCT_TABS));
    expect(pairs(TAB_ROUTES.inventory.tabs)).toEqual(pairs(INVENTORY_TABS));
    expect(pairs(TAB_ROUTES.traffic.tabs)).toEqual(pairs(TRAFFIC_TABS));
    expect(pairs(TAB_ROUTES.foresight.tabs)).toEqual(pairs(FORESIGHT_TABS));
    expect(pairs(TAB_ROUTES.discounts.tabs)).toEqual(pairs(DISCOUNT_TABS));
    expect(pairs(TAB_ROUTES.returns.tabs)).toEqual(fromIds(RETURNS_TAB_IDS, (k) => RETURNS_TAB_LABELS[k]));
    expect(pairs(TAB_ROUTES.spotlight.tabs)).toEqual(fromIds(SPOTLIGHT_TAB_IDS, spotlightTabLabel));
    expect(pairs(TAB_ROUTES.ads.tabs)).toEqual(fromIds(ADS_TAB_IDS, (k) => ADS_TAB_LABELS[k]));
    expect(pairs(TAB_ROUTES["email-marketing"].tabs)).toEqual(fromIds(EMAIL_TAB_IDS, (k) => EMAIL_TAB_LABELS[k]));
    expect(pairs(TAB_ROUTES["customer-support"].tabs)).toEqual(fromIds(SUPPORT_TAB_IDS, (k) => SUPPORT_TAB_LABELS[k]));
    // Path pages: each tab's own route is the root plus its key (the first is the root itself).
    for (const tabs of [PRODUCT_TABS, INVENTORY_TABS, TRAFFIC_TABS, FORESIGHT_TABS, DISCOUNT_TABS]) {
      tabs.forEach((tab, i) => expect(tab.basePath).toBe(i === 0 ? tabs[0].basePath : `${tabs[0].basePath}/${tab.key}`));
    }
  });

  it("name every connection as the Integrations page does", () => {
    for (const [key, { name, href }] of Object.entries(CONNECTIONS)) {
      if (key === "meta_ads") continue;
      const catalog = href.replace("/integrations/", "");
      expect(isIntegrationKey(catalog), key).toBe(true);
      if (isIntegrationKey(catalog)) expect(name).toBe(APPS[catalog].name);
    }
  });
});

describe("the visibility block", () => {
  it("adapts the backend's answer and refuses a malformed one", () => {
    expect(V.disclosure).toBe("guided");
    expect(V.pages.results).toEqual({ visible: false, reason: "no_data", needs: { action: "*" } });
    expect(V.tabs.products.fit).toEqual(loop);
    expect(V.integrationsShown).toEqual(["shopify"]);
    expect(toVisibility(null)).toBeNull();
    expect(toVisibility({} as ApiVisibility)).toBeNull();
    expect(toVisibility({ pages: { x: { visible: "yes" } } } as unknown as ApiVisibility)?.pages).toEqual({});
  });

  it("lays the guided pages over navigation, keeping ready, and leaves unnamed pages alone", () => {
    const nav: NavVisibility[] = [
      { key: "results", visible: true, ready: false, reason: null },
      { key: "orders", visible: false, ready: true, reason: "permission" },
    ];
    expect(guidedNavigation(nav, V)).toEqual([
      { key: "results", visible: false, ready: false, reason: "no_data", needs: { action: "*" } },
      { key: "orders", visible: false, ready: true, reason: "permission" },
    ]);
    expect(guidedNavigation(nav, null)).toBe(nav);
    expect(guidedNavigation(null, V)).toBeNull();
  });

  it("changes nothing for a full organization", () => {
    const navigation: NavVisibility[] = [
      { key: "dashboard", visible: true, ready: true, reason: null },
      { key: "team-performance", visible: false, ready: true, reason: "not_connected" },
    ];
    const full: ApiVisibility = {
      disclosure: "full",
      pages: Object.fromEntries(navigation.map((n) => [n.key, { visible: n.visible, reason: n.reason, needs: null }])),
      tabs: {},
    };
    const ws = toWorkspace({ navigation, visibility: full });
    const shape = (n: NavVisibility) => [n.key, n.visible, n.ready, n.reason];
    expect(ws.navigation?.map(shape)).toEqual(navigation.map(shape));
    expect(ws.visibility?.tabs).toEqual({});
    expect(landingHref("/returns", ws.visibility)).toBe("/returns");
    expect(tabAccess("/products/fit", none, ws.visibility)).toEqual({ kind: "open" });
    expect(toWorkspace({ navigation }).visibility).toBeNull();
  });
});

describe("a tab bar", () => {
  const tabs = ["overview", "by-style", "sizing", "categories", "fixes", "bracketing"];
  const id = (t: string) => t;

  it("drops the locked tabs but keeps the open one", () => {
    const locked = lockedTabs(V, "/returns");
    expect(guidedTabs(tabs, id, locked, "bracketing")).toEqual(["bracketing"]);
    expect(guidedTabs(tabs, id, locked, "sizing")).toEqual(["sizing", "bracketing"]);
    expect(guidedTabs(tabs, id, lockedTabs(V, "/orders"), null)).toEqual(tabs);
    expect(guidedTabs(tabs, id, lockedTabs(null, "/returns"), null)).toEqual(tabs);
    expect(Object.keys(lockedTabs(V, "/employees/finance"))).toEqual([]);
  });

  it("leaves locked tabs out of Settings → Sidebar and locks on the first tab with data", () => {
    const [returns] = navPrefsTree(
      [{ title: "Returns Analytics", href: "/returns", icon: (() => null) as never }],
      () => [],
      new Set(),
      (href, key) => key in lockedTabs(V, href),
    );
    expect(returns.tabs).toEqual([{ id: "returns:bracketing", label: "Bracketing", locked: true, shown: true }]);
  });
});

describe("a tab in the URL", () => {
  it("is read in each page's own form", () => {
    expect(tabInUrl("/products/fit", none)).toEqual({ page: "products", tab: "fit", explicit: true });
    expect(tabInUrl("/products", none)).toEqual({ page: "products", tab: "overview", explicit: false });
    expect(tabInUrl("/products/123", none)).toBeNull(); // a product page, not a tab
    expect(tabInUrl("/inventory/transfers/review/send/4", none)?.tab).toBe("transfers");
    expect(tabInUrl("/returns", new URLSearchParams("tab=sizing"))).toEqual({ page: "returns", tab: "sizing", explicit: true });
    expect(tabInUrl("/returns", new URLSearchParams("tab=nope"))?.explicit).toBe(false);
    expect(tabInUrl("/spotlight/brand-brain/facts", none)).toBeNull();
    expect(tabInUrl("/orders", none)).toBeNull();
  });

  it("builds each page's own tab URL, keeping the date range", () => {
    const range = new URLSearchParams("range=30d&tab=overview");
    expect(tabHref("returns", "bracketing", range)).toBe("/returns?range=30d&tab=bracketing");
    expect(tabHref("products", "fit", range)).toBe("/products/fit?range=30d");
    expect(tabHref("products", "overview")).toBe("/products");
    for (const [page, route] of Object.entries(TAB_ROUTES)) {
      expect(route.root).toBe(`/${page}`);
      expect(route.tabs.length).toBeGreaterThan(1);
    }
  });
});

describe("where a page opens", () => {
  it("lands on the first tab with data when its opening tab is locked", () => {
    expect(firstOpenTab(V, "returns")).toBe("bracketing");
    expect(landingHref("/returns", V)).toBe("/returns?tab=bracketing");
    expect(landingHref("/email-marketing", V)).toBe("/email-marketing?tab=plan");
    expect(landingHref("/products", V)).toBe("/products"); // Overview has data
    expect(landingHref("/dashboard", V)).toBe("/dashboard");
    expect(landingHref("/returns", null)).toBe("/returns");
  });

  it("moves a bare page, answers a named locked tab, and opens the rest", () => {
    expect(tabAccess("/returns", new URLSearchParams("range=7d"), V)).toEqual({
      kind: "redirect",
      href: "/returns?range=7d&tab=bracketing",
    });
    expect(tabAccess("/products/fit", none, V)).toEqual({ kind: "locked", page: "products", tab: "fit", lock: loop });
    expect(tabAccess("/returns", new URLSearchParams("tab=bracketing"), V)).toEqual({ kind: "open" });
    expect(tabAccess("/products/catalog", none, V)).toEqual({ kind: "open" });
    expect(tabAccess("/products/fit", none, null)).toEqual({ kind: "open" });
  });
});

describe("what a locked screen says", () => {
  const nav: NavVisibility[] = toWorkspace({
    navigation: Object.keys(API.pages!).map((key) => ({ key, visible: true, ready: true, reason: null })),
    visibility: API,
  }).navigation!;

  it("offers to connect the integration a tab needs, on that integration's page", () => {
    const fit = tabLockAccess("products", "fit", loop, nav);
    expect(fit).toMatchObject({
      title: "Fit opens once Loop Returns is connected",
      action: { label: "Connect Loop Returns", href: "/integrations/loop" },
      back: { label: "Back to Product Analyst", href: "/products" },
      connect: true,
    });
    const noIntegrations = nav.map((n) => (n.key === "integrations" ? { ...n, visible: false } : n));
    expect(tabLockAccess("products", "fit", loop, noIntegrations).action).toBeNull();
    expect(integrationName("google")).toBe("Google Search Console");
    expect(integrationHref("google")).toBe("/integrations/gsc");
    expect(integrationHref("meta_ads")).toBe("/ads?tab=audit");
  });

  it("names the condition a tab waits on", () => {
    expect(tabLockAccess("inventory", "transfers", V.tabs.inventory.transfers, nav).title).toBe(
      "Warehouse → Store appears once your store has a second location",
    );
    expect(tabLockAccess("discounts", "staff", V.tabs.discounts.staff, nav).title).toBe(
      "Staff appears once you sell in store",
    );
    expect(tabLockAccess("foresight", "season", V.tabs.foresight.season, nav).title).toBe(
      "Season Radar reads the Hebrew calendar",
    );
    expect(
      tabLockAccess("foresight", "season", { reason: "needs_history", needs: { history_days: 1095 } }, nav).title,
    ).toBe("Season Radar needs three years of sales history");
  });

  it("answers a guided page with one action", () => {
    expect(accessFor("/results", nav)).toMatchObject({
      allowed: false,
      title: "Results appears after your first action",
      action: { label: "Open the Morning Brief", href: "/brief" },
    });
    expect(accessFor("/traffic/website", nav)).toMatchObject({
      title: "Store Traffic opens once V-Count is connected",
      action: { label: "Connect V-Count", href: "/integrations/vcount" },
      connect: true,
    });
    expect(accessFor("/social", nav)).toMatchObject({
      title: "Social Media Manager isn't active",
      action: { label: "Open Digital Employees", href: "/employees" },
    });
    expect(accessFor("/ai", nav)).toMatchObject({ title: "AI Performance is tucked away for now", action: null });
    expect(accessFor("/dashboard", nav).allowed).toBe(true);
  });
});

describe("the company's switches (SPEC-360)", () => {
  const W = toVisibility({
    disclosure: "guided",
    pages: {
      traffic: {
        visible: true,
        reason: "awaiting_connection",
        needs: { connection: "vcount", any_of: ["vcount", "clarity"], apps: ["vcount", "clarity"] },
      },
      orders: { visible: false, reason: "turned_off", needs: null },
      integrations: { visible: true, reason: null, needs: null },
    },
    tabs: { products: { fit: { reason: "awaiting_connection", needs: { connection: "loop", any_of: ["loop"] } } } },
  })!;
  const nav: NavVisibility[] = toWorkspace({
    navigation: ["traffic", "orders", "integrations"].map((key) => ({ key, visible: true, ready: true, reason: null })),
    visibility: {
      disclosure: "guided",
      pages: {
        traffic: {
        visible: true,
        reason: "awaiting_connection",
        needs: { connection: "vcount", any_of: ["vcount", "clarity"], apps: ["vcount", "clarity"] },
      },
        orders: { visible: false, reason: "turned_off", needs: null },
        integrations: { visible: true, reason: null, needs: null },
      },
    },
  }).navigation!;

  it("keeps a tab that waits for its connection in the bar, and opens it on the connect screen", () => {
    const tabs = ["overview", "catalog", "fit"];
    expect(guidedTabs(tabs, (t) => t, lockedTabs(W, "/products"), null)).toEqual(tabs);
    expect(tabAccess("/products/fit", none, W)).toMatchObject({ kind: "locked", tab: "fit" });
    expect(tabLockAccess("products", "fit", W.tabs.products.fit, nav)).toMatchObject({
      title: "Fit opens once Loop Returns is connected",
      action: { label: "Connect Loop Returns", href: "/integrations/loop" },
    });
  });

  it("opens a page waiting for its connection on the connect screen, naming every way to connect it", () => {
    expect(visibleItems([{ href: "/traffic" }, { href: "/orders" }], nav).map((i) => i.href)).toEqual(["/traffic"]);
    expect(accessFor("/traffic/website", nav)).toMatchObject({
      allowed: false,
      title: "Store Traffic is waiting for V-Count and Microsoft Clarity",
      action: { label: "Connect V-Count", href: "/integrations/vcount", integration: "vcount" },
      secondary: { label: "Connect Microsoft Clarity", href: "/integrations/clarity", integration: "clarity" },
      connect: true,
    });
  });

  it("says a page turned off for the company is off, and where to turn it back on", () => {
    expect(accessFor("/orders", nav)).toMatchObject({
      title: "Orders is turned off for your company",
      action: { label: "Open sidebar settings", href: "/settings/sidebar" },
    });
  });
});


describe("Returns sub-pages (SPEC-365)", () => {
  it("go through the gate of the tab they belong to", () => {
    expect(tabInUrl("/returns/style/123", none)).toEqual({ page: "returns", tab: "by-style", explicit: true });
    expect(tabInUrl("/returns/backlog/send", none)).toEqual({ page: "returns", tab: "overview", explicit: true });
    expect(tabInUrl("/returns/elsewhere", none)).toBeNull();
    expect(tabAccess("/returns/style/123", none, V)).toMatchObject({ kind: "locked", page: "returns", tab: "by-style" });
    expect(tabAccess("/returns/backlog/send", none, V)).toMatchObject({ kind: "locked", tab: "overview" });
    expect(tabAccess("/returns/style/123", none, null)).toEqual({ kind: "open" });
  });
});
