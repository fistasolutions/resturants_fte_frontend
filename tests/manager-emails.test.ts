import { describe, expect, it } from "vitest";

import { isValidEmail } from "@/lib/manager-emails";

describe("isValidEmail", () => {
  it("accepts a plausible email", () => {
    expect(isValidEmail("manager@store.com")).toBe(true);
  });

  it("rejects missing @ or domain", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@missing-local.com")).toBe(false);
  });
});
