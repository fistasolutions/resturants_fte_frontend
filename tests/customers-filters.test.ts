import { describe, expect, it } from "vitest";

import { customersPageHref, parseCustomersFilters } from "@/lib/customers-filters";

describe("parseCustomersFilters", () => {
  it("defaults to page 1 with no search", () => {
    expect(parseCustomersFilters({})).toEqual({ q: "", page: 1 });
  });

  it("trims and caps q at 80 chars", () => {
    const long = "a".repeat(100);
    expect(parseCustomersFilters({ q: `  ${long}  ` }).q).toBe(long.slice(0, 80));
  });

  it("clamps an invalid or negative page to 1", () => {
    expect(parseCustomersFilters({ page: "0" }).page).toBe(1);
    expect(parseCustomersFilters({ page: "-5" }).page).toBe(1);
    expect(parseCustomersFilters({ page: "not-a-number" }).page).toBe(1);
  });

  it("parses a valid page", () => {
    expect(parseCustomersFilters({ page: "3" }).page).toBe(3);
  });
});

describe("customersPageHref", () => {
  it("omits empty params for page 1 with no search", () => {
    expect(customersPageHref({}, 1)).toBe("/customers");
  });

  it("includes page when > 1", () => {
    expect(customersPageHref({}, 2)).toBe("/customers?page=2");
  });

  it("preserves the search term across pages", () => {
    expect(customersPageHref({ q: "vip" }, 3)).toBe("/customers?q=vip&page=3");
  });
});
