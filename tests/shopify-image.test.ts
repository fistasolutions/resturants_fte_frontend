import { describe, expect, it } from "vitest";

import { shopifyImageWidth } from "@/lib/shopify-image";

describe("shopifyImageWidth", () => {
  it("adds a width param to a Shopify CDN url", () => {
    expect(shopifyImageWidth("https://cdn.shopify.com/s/x/dress.jpg", 96)).toBe(
      "https://cdn.shopify.com/s/x/dress.jpg?width=96",
    );
  });

  it("overwrites an existing width rather than duplicating it", () => {
    expect(shopifyImageWidth("https://cdn.shopify.com/a.jpg?width=1200", 96)).toBe(
      "https://cdn.shopify.com/a.jpg?width=96",
    );
  });

  it("returns the original string when it isn't a valid url", () => {
    expect(shopifyImageWidth("not a url", 96)).toBe("not a url");
  });
});
