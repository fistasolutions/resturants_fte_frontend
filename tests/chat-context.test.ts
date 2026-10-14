import { describe, expect, it } from "vitest";

import { SUBJECT_ROUTES, humaniseSegment, pageContextFor, subjectOf } from "@/lib/chat-context";
import { DRAWER_PROMPTS_BY_SUBJECT, promptsFor, promptsForPath } from "@/lib/chat-drawer-prompts";
import { navItems } from "@/lib/navigation";

const TODAY = "2026-09-14";
const params = (query = "") => new URLSearchParams(query);

describe("pageContextFor — page and tab", () => {
  it("names the page by its sidebar title and the route", () => {
    const context = pageContextFor("/inventory", params(), TODAY);
    expect(context).toEqual({ route: "/inventory", page: "Inventory Analyst" });
  });

  it("reads the tab from the second path segment, humanised", () => {
    expect(pageContextFor("/inventory/dead-stock", params(), TODAY)?.tab).toBe("Dead stock");
    expect(pageContextFor("/products/true-profit", params(), TODAY)?.tab).toBe("True profit");
  });

  it("reads the tab from ?tab= first", () => {
    expect(pageContextFor("/spotlight", params("tab=daily-picks"), TODAY)?.tab).toBe("Daily picks");
    expect(pageContextFor("/returns", params("tab=by-style"), TODAY)?.tab).toBe("By style");
  });

  it("does not mistake an id for a tab", () => {
    expect(pageContextFor("/orders/8123456789", params(), TODAY)?.tab).toBeUndefined();
  });

  it("is null off the sidebar", () => {
    expect(pageContextFor("/login", params(), TODAY)).toBeNull();
    expect(pageContextFor("/no-such-page", params(), TODAY)).toBeNull();
  });

  it("is null on /chat only because the drawer never opens there — the page is still resolvable", () => {
    expect(pageContextFor("/chat", params(), TODAY)?.page).toBe("Chat with AI");
  });
});

describe("pageContextFor — range", () => {
  it("sends nothing when the URL names no period", () => {
    expect(pageContextFor("/dashboard", params(), TODAY)?.range).toBeUndefined();
    expect(pageContextFor("/dashboard", params("compare=none"), TODAY)?.range).toBeUndefined();
  });

  it("resolves a preset with the picker's own label and dates", () => {
    expect(pageContextFor("/inventory", params("range=7d"), TODAY)?.range).toEqual({
      label: "Last 7 days",
      start: "2026-09-08",
      end: "2026-09-14",
    });
  });

  it("accepts the legacy period= name", () => {
    expect(pageContextFor("/inventory", params("period=30d"), TODAY)?.range?.label).toBe("Last 30 days");
  });

  it("resolves a custom from/to and a single date", () => {
    expect(pageContextFor("/dashboard", params("from=2026-08-01&to=2026-08-31"), TODAY)?.range).toEqual({
      label: "Aug 1 – Aug 31, 2026",
      start: "2026-08-01",
      end: "2026-08-31",
    });
    expect(pageContextFor("/spotlight", params("date=2026-09-10"), TODAY)?.range?.start).toBe("2026-09-10");
  });
});

describe("pageContextFor — subjects", () => {
  it("captures the product on a product page and on a returns style page", () => {
    expect(pageContextFor("/products/8123456789", params(), TODAY)?.product_id).toBe(8123456789);
    expect(pageContextFor("/returns/style/8123456789", params(), TODAY)?.product_id).toBe(8123456789);
  });

  it("captures the order on an order page and the discount drill-downs", () => {
    expect(pageContextFor("/orders/5551234", params(), TODAY)?.order_id).toBe(5551234);
    expect(pageContextFor("/discounts/transactions/5551234", params(), TODAY)?.order_id).toBe(5551234);
    expect(pageContextFor("/discounts/attention/send/5551234", params(), TODAY)?.order_id).toBe(5551234);
  });

  it("captures the location on store pages and send pages", () => {
    expect(pageContextFor("/traffic/stores/75397202150", params(), TODAY)?.location_id).toBe(75397202150);
    expect(pageContextFor("/discounts/locations/75397202150", params(), TODAY)?.location_id).toBe(75397202150);
    expect(pageContextFor("/brief/traffic/send/75397202150", params(), TODAY)?.location_id).toBe(75397202150);
  });

  it("captures both ids on the two-level inventory routes", () => {
    const alert = pageContextFor("/inventory/dead-inventory-alerts/8123456789/75397202150", params(), TODAY);
    expect(alert?.product_id).toBe(8123456789);
    expect(alert?.location_id).toBe(75397202150);
    const transfer = pageContextFor("/inventory/store-transfers/75397202150/8123456789", params(), TODAY);
    expect(transfer?.location_id).toBe(75397202150);
    expect(transfer?.product_id).toBe(8123456789);
  });

  it("ignores non-numeric keys — 'online' is not a location id", () => {
    expect(pageContextFor("/orders/review/send/online", params(), TODAY)?.location_id).toBeUndefined();
    expect(pageContextFor("/orders/returns", params(), TODAY)?.order_id).toBeUndefined();
    expect(pageContextFor("/warehouse/packer/Amira", params(), TODAY)).toEqual({
      route: "/warehouse/packer/Amira",
      page: "Warehouse",
      tab: "Packer",
    });
  });

  it("reads the orders location filter from the query, numeric only", () => {
    expect(pageContextFor("/orders", params("location=75397202150"), TODAY)?.location_id).toBe(75397202150);
    expect(pageContextFor("/orders", params("location=online"), TODAY)?.location_id).toBeUndefined();
  });

  it("never sends an id that could overflow or is zero", () => {
    expect(pageContextFor("/products/0", params(), TODAY)?.product_id).toBeUndefined();
    expect(pageContextFor("/products/99999999999999999999", params(), TODAY)?.product_id).toBeUndefined();
  });

  it("only lists subject routes that sit under a sidebar destination", () => {
    const roots = new Set(navItems.map((item) => item.href));
    for (const { pattern } of SUBJECT_ROUTES) {
      expect(roots.has(`/${pattern.split("/")[1]}`), pattern).toBe(true);
    }
  });
});

describe("subjectOf and the subject prompts", () => {
  it("prefers product, then order, then location", () => {
    expect(subjectOf({ route: "/x", page: "X", product_id: 1, location_id: 2 })).toBe("product");
    expect(subjectOf({ route: "/x", page: "X", order_id: 1 })).toBe("order");
    expect(subjectOf({ route: "/x", page: "X", location_id: 1 })).toBe("location");
    expect(subjectOf({ route: "/x", page: "X" })).toBeNull();
    expect(subjectOf(null)).toBeNull();
  });

  it("subject prompts win over the route set; otherwise the route set applies", () => {
    expect(promptsFor("/products/123", "product")).toBe(DRAWER_PROMPTS_BY_SUBJECT.product);
    expect(promptsFor("/products", null)).toBe(promptsForPath("/products"));
  });

  it("every subject set has four prompts that speak of 'this'", () => {
    for (const set of Object.values(DRAWER_PROMPTS_BY_SUBJECT)) {
      expect(set).toHaveLength(4);
      for (const prompt of set) expect(prompt.label.toLowerCase()).toContain("this ");
    }
  });
});

describe("humaniseSegment", () => {
  it("turns a slug into a sentence-case label", () => {
    expect(humaniseSegment("dead-stock")).toBe("Dead stock");
    expect(humaniseSegment("voice_of_customer")).toBe("Voice of customer");
    expect(humaniseSegment("")).toBe("");
  });
});
