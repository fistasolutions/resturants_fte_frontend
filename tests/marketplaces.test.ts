import { describe, expect, it } from "vitest";

import { absoluteUrl } from "@/lib/marketplaces";

describe("marketplaces", () => {
  it("builds the aggregator's URL on the site's public proxy", () => {
    expect(absoluteUrl("https://app.example.com/", "/api/v1/storefront/marketplace/abc/orders")).toBe(
      "https://app.example.com/api/proxy/storefront/marketplace/abc/orders",
    );
  });
});
