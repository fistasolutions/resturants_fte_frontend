import { describe, expect, it } from "vitest";

import { ticketAge } from "@/lib/ticket-age";

const NOW = "2026-08-06T12:00:00Z";

describe("ticketAge", () => {
  it("returns null for missing/invalid/future input", () => {
    expect(ticketAge(null, NOW)).toBeNull();
    expect(ticketAge(undefined, NOW)).toBeNull();
    expect(ticketAge("not-a-date", NOW)).toBeNull();
    expect(ticketAge("2026-08-06T13:00:00Z", NOW)).toBeNull(); // future
  });

  it("shows days + hours when over a day", () => {
    expect(ticketAge("2026-08-03T08:00:00Z", NOW)).toBe("3d 4h");
  });

  it("shows hours + minutes under a day", () => {
    expect(ticketAge("2026-08-06T06:48:00Z", NOW)).toBe("5h 12m");
  });

  it("shows minutes only under an hour", () => {
    expect(ticketAge("2026-08-06T11:52:00Z", NOW)).toBe("8m");
  });
});
