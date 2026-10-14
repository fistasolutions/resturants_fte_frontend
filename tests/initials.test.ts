import { describe, expect, it } from "vitest";

import { initials } from "@/lib/initials";

describe("initials", () => {
  it("returns '?' for empty/nullish input", () => {
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });

  it("takes first + last initial for multi-word names", () => {
    expect(initials("Baruch Carlebach")).toBe("BC");
    expect(initials("Adebayo Oluwakemi Junior")).toBe("AJ");
  });

  it("takes up to two letters for a single token", () => {
    expect(initials("Avigail")).toBe("AV");
    expect(initials("A")).toBe("A");
  });

  it("collapses extra whitespace", () => {
    expect(initials("  Store   Customer  ")).toBe("SC");
  });
});
