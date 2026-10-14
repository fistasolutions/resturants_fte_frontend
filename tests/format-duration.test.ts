import { describe, expect, it } from "vitest";

import { formatDuration } from "@/lib/format-duration";

describe("formatDuration (SPEC-081)", () => {
  it("renders null as an em dash", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("renders sub-minute durations as <1m", () => {
    expect(formatDuration(0)).toBe("<1m");
    expect(formatDuration(45)).toBe("<1m");
  });

  it("renders minutes only under an hour", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(600)).toBe("10m");
    expect(formatDuration(3540)).toBe("59m");
  });

  it("renders hours with no minute remainder cleanly", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(7200)).toBe("2h");
  });

  it("renders hours and minutes together", () => {
    expect(formatDuration(4800)).toBe("1h 20m");
    expect(formatDuration(6660)).toBe("1h 51m");
  });

  it("rounds to the nearest minute", () => {
    expect(formatDuration(89)).toBe("1m");
    expect(formatDuration(3661)).toBe("1h 1m");
  });
});
