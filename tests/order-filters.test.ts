import { describe, expect, it } from "vitest";

import {
  drilldownHref,
  isSafeOrdersReturnPath,
  locationLabel,
  filterChips,
  filterSummary,
  ordersApiQuery,
  ordersPageHref,
  parseOrderFilters,
  returnsSpikeHref,
} from "@/lib/order-filters";

describe("parseOrderFilters (SPEC-038)", () => {
  it("accepts valid params", () => {
    expect(
      parseOrderFilters({
        fulfillment: "unfulfilled",
        location: "301",
        loc_name: "Jackson",
        age: "48_plus",
        q: " #FM1 ",
        page: "3",
      }),
    ).toEqual({
      fulfillment: "unfulfilled",
      location: "301",
      locationName: "Jackson",
      product: null,
      productName: null,
      age: "48_plus",
      from: null,
      to: null,
      q: "#FM1",
      page: 3,
      view: null,
    });
  });

  it("accepts the online location and drops loc_name without a location", () => {
    expect(parseOrderFilters({ location: "online" }).location).toBe("online");
    expect(parseOrderFilters({ loc_name: "Jackson" }).locationName).toBeNull();
  });

  it("accepts a numeric product id + display name, drops product_name without a product", () => {
    expect(
      parseOrderFilters({ product: "7001", product_name: "Alpha Tee" }),
    ).toMatchObject({ product: "7001", productName: "Alpha Tee" });
    expect(parseOrderFilters({ product_name: "Alpha Tee" }).productName).toBeNull();
    expect(parseOrderFilters({ product: "not-a-number" }).product).toBeNull();
  });

  it("rejects garbage — nulls and defaults, never throws", () => {
    expect(
      parseOrderFilters({
        fulfillment: "shipped",
        location: "1; DROP TABLE",
        age: "72h",
        page: "-4",
      }),
    ).toEqual({
      fulfillment: null,
      location: null,
      locationName: null,
      product: null,
      productName: null,
      age: null,
      from: null,
      to: null,
      q: "",
      page: 1,
      view: null,
    });
  });
});

describe("ordersApiQuery", () => {
  const filters = parseOrderFilters({
    fulfillment: "unfulfilled",
    location: "online",
    age: "0_24",
    q: "FM",
  });

  it("builds the backend query, sharing shape between list and export", () => {
    expect(ordersApiQuery(filters, 25, 50)).toBe(
      "fulfillment=unfulfilled&location=online&age=0_24&search=FM&limit=25&offset=50",
    );
    expect(ordersApiQuery(filters)).toBe(
      "fulfillment=unfulfilled&location=online&age=0_24&search=FM",
    );
  });

  it("omits empty filters", () => {
    expect(ordersApiQuery(parseOrderFilters({}), 25, 0)).toBe("limit=25&offset=0");
  });

  it("includes product (SPEC-053 backend contract)", () => {
    expect(ordersApiQuery(parseOrderFilters({ product: "7001" }))).toBe("product=7001");
  });

  it("includes view for the backend request (SPEC-079, backend SPEC-071)", () => {
    expect(ordersApiQuery({ ...parseOrderFilters({}), view: "returns" })).toBe(
      "view=returns",
    );
    expect(
      ordersApiQuery({ ...parseOrderFilters({ fulfillment: "fulfilled" }), view: "cancelled" }),
    ).toBe("fulfillment=fulfilled&view=cancelled");
  });
});

describe("drilldownHref (report → orders page)", () => {
  it("maps a POS row with its name and age bucket", () => {
    expect(
      drilldownHref({ location_id: 301, location: "Jackson" }, "48_plus"),
    ).toBe("/orders?fulfillment=unfulfilled&location=301&loc_name=Jackson&age=48_plus");
  });

  it("maps the online row (NULL location_id) without age", () => {
    expect(
      drilldownHref({ location_id: null, location: "Online / unattributed" }),
    ).toBe(
      "/orders?fulfillment=unfulfilled&location=online&loc_name=Online+%2F+unattributed",
    );
  });
});

describe("chips + summary", () => {
  const filters = parseOrderFilters({
    fulfillment: "unfulfilled",
    location: "301",
    loc_name: "Jackson",
    age: "48_plus",
    q: "FM",
    page: "2",
  });

  it("each chip removes exactly its own filter and resets the page", () => {
    const chips = filterChips(filters);
    expect(chips.map((chip) => chip.label)).toEqual([
      "Unfulfilled",
      "Jackson",
      "Placed 48h+ ago",
    ]);
    expect(chips[0].removeHref).toBe(
      "/orders?location=301&loc_name=Jackson&age=48_plus&q=FM",
    );
    expect(chips[1].removeHref).toBe("/orders?fulfillment=unfulfilled&age=48_plus&q=FM");
    expect(chips[2].removeHref).toBe(
      "/orders?fulfillment=unfulfilled&location=301&loc_name=Jackson&q=FM",
    );
  });

  it("labels the online bucket and falls back without a name", () => {
    expect(
      filterSummary(parseOrderFilters({ fulfillment: "unfulfilled", location: "online" })),
    ).toBe("Unfulfilled · Online / unattributed");
    expect(filterSummary(parseOrderFilters({ location: "42" }))).toBe("Location 42");
    expect(filterSummary(parseOrderFilters({}))).toBe("All orders");
  });

  it("chips a product filter, labeled and falling back without a name (SPEC-059)", () => {
    const withName = parseOrderFilters({ product: "7001", product_name: "Alpha Tee" });
    expect(filterChips(withName)).toEqual([
      { label: "Alpha Tee", removeHref: "/orders" },
    ]);
    expect(filterSummary(parseOrderFilters({ product: "7001" }))).toBe("Product 7001");
  });
});

describe("ordersPageHref pagination", () => {
  it("keeps filters and adds the page only past 1", () => {
    const filters = parseOrderFilters({ fulfillment: "unfulfilled", q: "FM" });
    expect(ordersPageHref(filters, 2)).toBe("/orders?fulfillment=unfulfilled&q=FM&page=2");
    expect(ordersPageHref(filters, 1)).toBe("/orders?fulfillment=unfulfilled&q=FM");
    expect(ordersPageHref({}, 1)).toBe("/orders");
  });
});

describe("ordersPageHref basePath (SPEC-079)", () => {
  it("defaults to the All tab", () => {
    const filters = parseOrderFilters({ location: "301" });
    expect(ordersPageHref(filters)).toBe("/orders?location=301");
  });

  it("targets a tab's own route and never serializes view", () => {
    const filters = { ...parseOrderFilters({ location: "301" }), view: "returns" as const };
    expect(ordersPageHref(filters, 1, "/orders/returns")).toBe(
      "/orders/returns?location=301",
    );
  });

  it("falls back to the bare basePath with no filters", () => {
    expect(ordersPageHref({}, 1, "/orders/cancelled")).toBe("/orders/cancelled");
  });
});

describe("locationLabel (SPEC-039)", () => {
  const locations = [
    { id: 301, name: "Jackson" },
    { id: 302, name: "Lawrence" },
  ];

  it("resolves from the scopes list first", () => {
    const filters = parseOrderFilters({ location: "301", loc_name: "Old Name" });
    expect(locationLabel(filters, locations)).toBe("Jackson");
  });

  it("labels online, falls back to loc_name, then to a generic label", () => {
    expect(locationLabel(parseOrderFilters({ location: "online" }), locations)).toBe(
      "Online / unattributed",
    );
    expect(
      locationLabel(parseOrderFilters({ location: "999", loc_name: "Y London" }), locations),
    ).toBe("Y London");
    expect(locationLabel(parseOrderFilters({ location: "999" }), locations)).toBe(
      "Location 999",
    );
  });

  it("is null without a location filter", () => {
    expect(locationLabel(parseOrderFilters({}), locations)).toBeNull();
  });
});

describe("placed-date range (SPEC-040)", () => {
  it("parses a valid pair, swaps inverted, clamps future to today", () => {
    const parsed = parseOrderFilters({ from: "2026-07-10", to: "2026-07-01" });
    expect(parsed).toMatchObject({ from: "2026-07-01", to: "2026-07-10" });

    const todayISO = new Date().toISOString().slice(0, 10);
    const future = parseOrderFilters({ from: "2999-01-01", to: "2999-01-05" });
    expect(future).toMatchObject({ from: todayISO, to: todayISO });
  });

  it("drops half pairs and garbage", () => {
    expect(parseOrderFilters({ from: "2026-07-01" })).toMatchObject({
      from: null,
      to: null,
    });
    expect(parseOrderFilters({ from: "junk", to: "2026-07-01" })).toMatchObject({
      from: null,
      to: null,
    });
  });

  it("reaches the API as start/end and survives page links", () => {
    const filters = parseOrderFilters({
      fulfillment: "unfulfilled",
      from: "2026-07-01",
      to: "2026-07-10",
    });
    expect(ordersApiQuery(filters, 25, 0)).toBe(
      "fulfillment=unfulfilled&start=2026-07-01&end=2026-07-10&limit=25&offset=0",
    );
    expect(ordersPageHref(filters, 2)).toBe(
      "/orders?fulfillment=unfulfilled&from=2026-07-01&to=2026-07-10&page=2",
    );
  });
});

describe("returnsSpikeHref (SPEC-059, backend SPEC-053)", () => {
  it("builds a product-filtered orders link with a display name", () => {
    expect(returnsSpikeHref(7001, "Alpha Tee")).toBe(
      "/orders?product=7001&product_name=Alpha+Tee",
    );
  });
});

describe("isSafeOrdersReturnPath (SPEC-080)", () => {
  it("accepts every Orders tab, with or without a query string", () => {
    expect(isSafeOrdersReturnPath("/orders")).toBe(true);
    expect(isSafeOrdersReturnPath("/orders?location=301&page=2")).toBe(true);
    expect(isSafeOrdersReturnPath("/orders/returns")).toBe(true);
    expect(isSafeOrdersReturnPath("/orders/cancelled?age=0_24")).toBe(true);
    expect(isSafeOrdersReturnPath("/orders/discounted")).toBe(true);
  });

  it("rejects anything that isn't exactly one of the four tab routes", () => {
    expect(isSafeOrdersReturnPath("https://evil.example")).toBe(false);
    expect(isSafeOrdersReturnPath("//evil.example")).toBe(false);
    expect(isSafeOrdersReturnPath("/orders.evil.example")).toBe(false);
    expect(isSafeOrdersReturnPath("/orders/returns-spike")).toBe(false);
    expect(isSafeOrdersReturnPath("/orders/123")).toBe(false);
    expect(isSafeOrdersReturnPath("javascript:alert(1)")).toBe(false);
  });
});
