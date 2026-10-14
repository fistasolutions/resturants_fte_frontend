import { describe, expect, it } from "vitest";

import { agoLabel, footerTone, freshnessSegments, hasReceipt, secondsLabel, toolsLabel } from "@/lib/trust-footer";

const NOW = new Date("2026-09-17T09:42:00Z").getTime();
const at = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();

describe("agoLabel", () => {
  it("reads in minutes, hours, days", () => {
    expect(agoLabel(at(0), NOW)).toBe("just now");
    expect(agoLabel(at(4), NOW)).toBe("4 min ago");
    expect(agoLabel(at(59), NOW)).toBe("59 min ago");
    expect(agoLabel(at(180), NOW)).toBe("3 h ago");
    expect(agoLabel(at(60 * 26), NOW)).toBe("1 day ago");
    expect(agoLabel("nope", NOW)).toBe("");
  });
});

describe("freshnessSegments / footerTone", () => {
  it("labels each system and marks the stale ones", () => {
    const segments = freshnessSegments(
      [
        { system: "Shopify", synced_at: at(4), records: 12 },
        { system: "Loop Returns", synced_at: at(200), records: 1 },
        { system: "Tax engine", synced_at: null, records: 0 },
      ],
      NOW,
    );
    expect(segments).toEqual([
      { system: "Shopify", label: "synced 4 min ago", stale: false },
      { system: "Loop Returns", label: "synced 3 h ago", stale: true },
      { system: "Tax engine", label: "no sync", stale: false },
    ]);
    expect(footerTone([{ system: "Shopify", synced_at: at(4), records: 1 }], NOW)).toBe("fresh");
    expect(footerTone([{ system: "Loop Returns", synced_at: at(200), records: 1 }], NOW)).toBe("stale");
    expect(footerTone([{ system: "Tax engine", synced_at: null, records: 0 }], NOW)).toBe("unknown");
    expect(footerTone([], NOW)).toBe("unknown");
  });
});

describe("labels", () => {
  it("count, seconds, receipt", () => {
    expect(toolsLabel(1)).toBe("1 tool ran");
    expect(toolsLabel(3)).toBe("3 tools ran");
    expect(secondsLabel(900)).toBe("0.9 s");
    expect(secondsLabel(12_400)).toBe("12 s");
    expect(secondsLabel(0)).toBe("");
    expect(hasReceipt(undefined)).toBe(false);
    expect(hasReceipt([{ tool: "x", system: "Shopify", asked: "", returned: [], ms: 1 }])).toBe(true);
  });
});
