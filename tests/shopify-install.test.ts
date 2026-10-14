import { describe, expect, it } from "vitest";

import {
  INSTALL_PROBLEM_PATH,
  installProblem,
  installProblemHref,
  installProblemText,
  isShopifyLaunch,
  queryRecord,
  readInstallCookie,
  serializeInstallCookie,
} from "@/lib/shopify-install";

const CLAIM = "a".repeat(43);

describe("Shopify launch (SPEC-344)", () => {
  it("is Shopify's signed launch query", () => {
    expect(
      isShopifyLaunch(new URLSearchParams("shop=x.myshopify.com&hmac=abc&timestamp=1&host=aG9zdA")),
    ).toBe(true);
  });

  it("is not an OAuth return, which carries code and state too", () => {
    const back = "shop=x.myshopify.com&hmac=abc&timestamp=1&code=c&state=s";
    expect(isShopifyLaunch(new URLSearchParams(back))).toBe(false);
    expect(isShopifyLaunch(new URLSearchParams("shop=x&hmac=a&timestamp=1&state=s"))).toBe(false);
  });

  it("is not an ordinary page or a partial query", () => {
    for (const query of ["", "plan=growth", "shop=x.myshopify.com", "shop=x&hmac=a"]) {
      expect(isShopifyLaunch(new URLSearchParams(query))).toBe(false);
    }
  });

  it("keeps every parameter once, exactly as signed", () => {
    expect(queryRecord(new URLSearchParams("shop=x&hmac=a&hmac=b&timestamp=1"))).toEqual({
      shop: "x",
      hmac: "a",
      timestamp: "1",
    });
  });
});

describe("the install cookie", () => {
  it("round-trips a claim", () => {
    const value = serializeInstallCookie({ claim: CLAIM, shop: "merchant.myshopify.com" });
    expect(readInstallCookie(value)).toEqual({ claim: CLAIM, shop: "merchant.myshopify.com" });
  });

  it("refuses anything missing, malformed or tampered with", () => {
    for (const value of [
      undefined,
      null,
      "",
      "not json",
      "[]",
      JSON.stringify({ claim: CLAIM }),
      JSON.stringify({ claim: "short", shop: "merchant.myshopify.com" }),
      JSON.stringify({ claim: CLAIM, shop: "evil.com" }),
      JSON.stringify({ claim: `${CLAIM}<script>`, shop: "merchant.myshopify.com" }),
    ]) {
      expect(readInstallCookie(value)).toBeNull();
    }
  });
});

describe("a failed install, in words", () => {
  it("names cancelled and expired, and calls anything else a failure", () => {
    expect(installProblem("cancelled")).toBe("cancelled");
    expect(installProblem("expired")).toBe("expired");
    expect(installProblem("<anything>")).toBe("failed");
    expect(installProblem(undefined)).toBe("failed");
    expect(installProblemText("cancelled").title).toBe("Installation cancelled");
    expect(installProblemHref("expired")).toBe(`${INSTALL_PROBLEM_PATH}?reason=expired`);
  });
});
