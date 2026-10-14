import { describe, expect, it } from "vitest";

import { parseWinbackFilters, winbackPageHref } from "@/lib/winback-filters";

describe("parseWinbackFilters", () => {
  it("defaults to page 1 with no filters", () => {
    expect(parseWinbackFilters({})).toEqual({
      q: "",
      page: 1,
      minSpend: null,
      minSilent: null,
    });
  });

  it("trims and caps q at 80 chars", () => {
    const long = "a".repeat(100);
    expect(parseWinbackFilters({ q: `  ${long}  ` }).q).toBe(long.slice(0, 80));
  });

  it("clamps an invalid or negative page to 1", () => {
    expect(parseWinbackFilters({ page: "0" }).page).toBe(1);
    expect(parseWinbackFilters({ page: "-5" }).page).toBe(1);
    expect(parseWinbackFilters({ page: "not-a-number" }).page).toBe(1);
  });

  it("parses a valid page", () => {
    expect(parseWinbackFilters({ page: "3" }).page).toBe(3);
  });

  it("parses min_spend and min_silent", () => {
    const f = parseWinbackFilters({ min_spend: "500", min_silent: "60" });
    expect(f.minSpend).toBe(500);
    expect(f.minSilent).toBe(60);
  });

  it("ignores invalid or non-positive min_spend/min_silent", () => {
    expect(parseWinbackFilters({ min_spend: "0" }).minSpend).toBeNull();
    expect(parseWinbackFilters({ min_spend: "-10" }).minSpend).toBeNull();
    expect(parseWinbackFilters({ min_spend: "abc" }).minSpend).toBeNull();
    expect(parseWinbackFilters({ min_silent: "" }).minSilent).toBeNull();
  });
});

describe("winbackPageHref", () => {
  it("omits empty params for page 1 with no filters", () => {
    expect(winbackPageHref({}, 1)).toBe("/customers/winback");
  });

  it("includes page when > 1", () => {
    expect(winbackPageHref({}, 2)).toBe("/customers/winback?page=2");
  });

  it("preserves the search term across pages", () => {
    expect(winbackPageHref({ q: "vip" }, 3)).toBe("/customers/winback?q=vip&page=3");
  });

  it("preserves min_spend and min_silent across pages", () => {
    expect(winbackPageHref({ minSpend: 500, minSilent: 60 }, 2)).toBe(
      "/customers/winback?min_spend=500&min_silent=60&page=2",
    );
  });
});
