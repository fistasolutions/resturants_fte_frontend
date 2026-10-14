import { House, Settings } from "lucide-react";
import { describe, expect, it } from "vitest";

import { hubChildren, navItems, sidebarItems } from "@/lib/navigation";
import {
  isPageShown,
  navPrefsCookie,
  navPrefsCookieString,
  pageId,
  parseHidden,
  serializeHidden,
  tabId,
  visibleNavItems,
  visibleTabs,
} from "@/lib/nav-prefs";
import { PAGE_TABS, hiddenCount, navPrefsTree } from "@/lib/nav-tab-registry";

describe("ids", () => {
  it("turns a route into a page id and a tab id", () => {
    expect(pageId("/products")).toBe("products");
    expect(pageId("/employees/finance")).toBe("employees.finance");
    expect(tabId("/products", "catalog")).toBe("products:catalog");
  });

  it("gives every registered page and tab an id the cookie can carry unencoded", () => {
    for (const [href, tabs] of Object.entries(PAGE_TABS)) {
      for (const tab of tabs) {
        const id = tabId(href, tab.key);
        expect(parseHidden(id).has(id), id).toBe(true);
      }
    }
  });
});

describe("cookie", () => {
  it("is per account and keeps the email out of the name", () => {
    const a = navPrefsCookie("owner@examplestore.com");
    expect(a).toMatch(/^nav_hidden_[a-z0-9]+$/);
    expect(a).not.toContain("examplestore");
    expect(navPrefsCookie(" Owner@ExampleStore.com ")).toBe(a);
    expect(navPrefsCookie("manager@examplestore.com")).not.toBe(a);
  });

  it("round-trips hidden ids and drops anything malformed", () => {
    const hidden = parseHidden("orders,products:catalog,<script>,,a b, inventory ");
    expect([...hidden].sort()).toEqual(["inventory", "orders", "products:catalog"]);
    expect(serializeHidden(hidden)).toBe("inventory,orders,products:catalog");
    expect(parseHidden(null).size).toBe(0);
    expect(parseHidden("").size).toBe(0);
  });

  it("caps how many ids it reads", () => {
    const many = Array.from({ length: 1000 }, (_, i) => `p${i}`).join(",");
    expect(parseHidden(many).size).toBe(400);
  });

  it("writes a one-year cookie, and clears it when nothing is hidden", () => {
    expect(navPrefsCookieString("nav_hidden_x", new Set(["orders"]))).toBe(
      "nav_hidden_x=orders; path=/; max-age=31536000; samesite=lax",
    );
    expect(navPrefsCookieString("nav_hidden_x", new Set())).toBe("nav_hidden_x=; path=/; max-age=0; samesite=lax");
  });

  it("stays well under the 4 KB cookie limit with everything hidden", () => {
    const all = new Set<string>([
      ...navItems.map((item) => pageId(item.href)),
      ...hubChildren("/employees").map((item) => pageId(item.href)),
      ...Object.entries(PAGE_TABS).flatMap(([href, tabs]) => tabs.map((tab) => tabId(href, tab.key))),
    ]);
    expect(serializeHidden(all).length).toBeLessThan(3500);
  });
});

describe("filtering", () => {
  const items = [
    { href: "/dashboard" },
    { href: "/orders" },
    { href: "/settings" },
  ];

  it("shows everything when nothing is hidden", () => {
    expect(visibleNavItems(items, new Set())).toEqual(items);
  });

  it("drops hidden pages but never Settings", () => {
    const hidden = new Set(["orders", "settings"]);
    expect(visibleNavItems(items, hidden).map((i) => i.href)).toEqual(["/dashboard", "/settings"]);
    expect(isPageShown("/settings", hidden)).toBe(true);
  });

  const tabs = [{ key: "overview" }, { key: "catalog" }, { key: "fit" }];
  const keyOf = (tab: { key: string }) => tab.key;

  it("drops hidden tabs", () => {
    const hidden = new Set(["products:catalog"]);
    expect(visibleTabs("/products", tabs, keyOf, hidden, "overview").map(keyOf)).toEqual(["overview", "fit"]);
  });

  it("always keeps the first tab and the open one", () => {
    const hidden = new Set(["products:overview", "products:catalog", "products:fit"]);
    expect(visibleTabs("/products", tabs, keyOf, hidden, "fit").map(keyOf)).toEqual(["overview", "fit"]);
    expect(visibleTabs("/products", tabs, keyOf, hidden, null).map(keyOf)).toEqual(["overview"]);
  });

  it("only reads its own page's ids", () => {
    const hidden = new Set(["inventory:catalog"]);
    expect(visibleTabs("/products", tabs, keyOf, hidden, null)).toHaveLength(3);
  });
});

describe("registry", () => {
  const destinations = new Set([...navItems, ...hubChildren("/employees")].map((item) => item.href));

  it("names only real sidebar destinations", () => {
    for (const href of Object.keys(PAGE_TABS)) expect(destinations.has(href), href).toBe(true);
  });

  it("covers every employee under Digital Employees", () => {
    for (const child of hubChildren("/employees")) expect(PAGE_TABS[child.href], child.href).toBeDefined();
  });

  it("has unique tab keys per page", () => {
    for (const [href, tabs] of Object.entries(PAGE_TABS)) {
      const keys = tabs.map((tab) => tab.key);
      expect(new Set(keys).size, href).toBe(keys.length);
    }
  });
});

describe("navPrefsTree", () => {
  const items = [
    { title: "Dashboard", href: "/dashboard", icon: House },
    { title: "Products", href: "/products", icon: House },
    { title: "Digital Employees", href: "/employees", icon: House },
    { title: "Settings", href: "/settings", icon: Settings },
  ];
  const childrenOf = (href: string) => (href === "/employees" ? hubChildren(href) : []);

  it("lists pages, their sub-pages and tabs, all on by default", () => {
    const tree = navPrefsTree(items, childrenOf, new Set());
    expect(tree.map((n) => n.id)).toEqual(["dashboard", "products", "employees", "settings"]);
    expect(tree.every((n) => n.shown)).toBe(true);
    expect(tree[1].tabs[0]).toMatchObject({ id: "products:overview", locked: true, shown: true });
    expect(tree[2].children.map((c) => c.href)).toEqual(hubChildren("/employees").map((c) => c.href));
    expect(tree[3].locked).toBe(true);
    expect(tree.map(hiddenCount)).toEqual([0, 0, 0, 0]);
  });

  it("reflects what is hidden and counts it", () => {
    const tree = navPrefsTree(items, childrenOf, new Set(["products:catalog", "products:fit", "spotlight", "spotlight:chat"]));
    expect(hiddenCount(tree[1])).toBe(2);
    const spotlight = tree[2].children.find((c) => c.href === "/spotlight");
    expect(spotlight?.shown).toBe(false);
    expect(hiddenCount(tree[2])).toBe(2);
  });

  it("never lets the first tab read as hidden", () => {
    const tree = navPrefsTree(items, childrenOf, new Set(["products:overview"]));
    expect(tree[1].tabs[0].shown).toBe(true);
  });

  it("draws the real sidebar", () => {
    expect(navPrefsTree(sidebarItems, hubChildren, new Set()).length).toBe(sidebarItems.length);
  });
});
