import { describe, expect, it } from "vitest";

import { signInProviders } from "@/lib/auth-providers";

describe("sign-in provider switches (SPEC-340)", () => {
  it("offers Google and hides Shopify when nothing is set", () => {
    expect(signInProviders(undefined, undefined)).toEqual({
      google: true,
      shopify: false,
      any: true,
    });
  });

  it("hides Google only for the exact string 'false'", () => {
    expect(signInProviders("false", undefined).google).toBe(false);
    for (const value of [undefined, "", "true", "FALSE", "0", " false"]) {
      expect(signInProviders(value, undefined).google).toBe(true);
    }
  });

  it("offers Shopify only for the exact string 'true'", () => {
    expect(signInProviders(undefined, "true").shopify).toBe(true);
    for (const value of [undefined, "", "false", "TRUE", "1", "yes", " true"]) {
      expect(signInProviders(undefined, value).shopify).toBe(false);
    }
  });

  it("draws nothing when both are off", () => {
    expect(signInProviders("false", "false").any).toBe(false);
  });
});
