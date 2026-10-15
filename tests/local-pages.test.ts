import { describe, expect, it } from "vitest";

import {
  directionsUrl,
  editErrors,
  jsonLdScript,
  lengthHint,
  missingCount,
  pageState,
  priceText,
  restaurantJsonLd,
  sitemapXml,
  spansText,
} from "@/lib/local-pages";
import { spotlightTabsFor } from "@/lib/spotlight";
import type { LocalPageBranch, PublicLocationPage } from "@/types/local-pages";

const row = (page: LocalPageBranch["page"]): LocalPageBranch => ({
  branchId: 1,
  code: "101",
  name: "Downtown",
  city: "Springfield",
  branchStatus: "open",
  page,
  publicPath: null,
});

const draft = {
  slug: "downtown-springfield",
  headline: "h",
  intro: "i",
  seoTitle: "t",
  seoDescription: "d",
  status: "draft" as const,
  writtenByModel: true,
  publishedAt: null,
  updatedAt: null,
};

const PAGE: PublicLocationPage = {
  brand: { name: "Example Pizza", slug: "example", currency: "usd" },
  page: { slug: "downtown", headline: "h", intro: "i", seoTitle: "t", seoDescription: "d", updatedAt: null },
  branch: {
    id: 1,
    name: "Downtown",
    addressLine: "1 Main St",
    city: "Springfield",
    state: null,
    postalCode: "12345",
    address: "1 Main St, Springfield, 12345",
    phone: "555-0100",
    lat: 40.1,
    lng: -74.2,
    hours: [
      { day: "Monday", spans: [["11:00", "22:00"]] },
      { day: "Friday", spans: [["17:00", "01:00"]] },
      { day: "Sunday", spans: [] },
    ],
    openNow: true,
    delivery: true,
    carryout: true,
    ordersOnline: true,
  },
  highlights: [],
};

describe("local pages", () => {
  it("names each branch's state and counts the missing pages", () => {
    expect(pageState(row(null))).toBe("none");
    expect(pageState(row(draft))).toBe("draft");
    expect(pageState(row({ ...draft, status: "published" }))).toBe("published");
    expect(missingCount([row(null), row(draft), row(null)])).toBe(2);
  });

  it("counts lengths and refuses empty or long fields", () => {
    expect(lengthHint("  abc ", "seoTitle")).toEqual({ text: "3 / 60", over: false });
    expect(lengthHint("x".repeat(61), "seoTitle").over).toBe(true);
    const ok = { headline: "a", intro: "b", seoTitle: "c", seoDescription: "d" };
    expect(editErrors(ok)).toEqual([]);
    expect(editErrors({ ...ok, headline: " ", seoDescription: "x".repeat(156) })).toEqual([
      "Headline cannot be empty.",
      "Search description is at most 155 characters.",
    ]);
  });

  it("builds schema.org Restaurant markup from the branch", () => {
    const ld = restaurantJsonLd(PAGE, "https://site/r/example/downtown", "https://site/order/example");
    expect(ld["@type"]).toBe("Restaurant");
    expect(ld.name).toBe("Example Pizza Downtown");
    expect(ld.telephone).toBe("555-0100");
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "1 Main St",
      addressLocality: "Springfield",
      postalCode: "12345",
    });
    expect(ld.geo).toEqual({ "@type": "GeoCoordinates", latitude: 40.1, longitude: -74.2 });
    expect(ld.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "11:00", closes: "22:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Friday", opens: "17:00", closes: "23:59" },
    ]);
    expect(jsonLdScript({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });

  it("writes the sitemap, prices, hours and directions", () => {
    const xml = sitemapXml("https://site", "example", [{ slug: "a&b", updatedAt: "2026-10-16T10:00:00Z" }]);
    expect(xml).toContain("<loc>https://site/r/example</loc>");
    expect(xml).toContain("<loc>https://site/r/example/a%26b</loc><lastmod>2026-10-16</lastmod>");
    expect(priceText(12, "usd")).toBe("$12.00");
    expect(priceText(12, "nope")).toBe("$12.00");
    expect(spansText([])).toBe("Closed");
    expect(spansText([["11:00", "14:00"], ["17:00", "22:00"]])).toBe("11:00–14:00, 17:00–22:00");
    expect(directionsUrl("1 Main St", null, null)).toContain("query=1%20Main%20St");
    expect(directionsUrl("x", 1, 2)).toContain("query=1%2C2");
  });

  it("offers Local pages to a restaurant brand only", () => {
    expect(spotlightTabsFor([])).not.toContain("local-pages");
    expect(spotlightTabsFor(["restaurant"])).toContain("local-pages");
    expect(spotlightTabsFor(["restaurant"]).length).toBe(spotlightTabsFor([]).length + 1);
  });
});
