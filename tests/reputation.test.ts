import { describe, expect, it } from "vitest";

import { filterRatings, share, starsText, tagsFor, toggleTag } from "@/lib/reputation";
import type { GuestRating } from "@/types/restaurant-os";

const r = (id: number, stars: number, needsReply: boolean): GuestRating => ({
  id,
  orderNumber: id,
  branchId: 1,
  branch: "#101",
  guest: null,
  stars,
  tags: [],
  comment: null,
  needsReply,
  replyStatus: "none",
  replyDraft: null,
  replyText: null,
  repliedAt: null,
  createdAt: null,
});

describe("reputation", () => {
  it("offers complaints for low stars and praise for high", () => {
    expect(tagsFor(2)).toContain("cold");
    expect(tagsFor(5)).toContain("great_taste");
    expect(tagsFor(3)).not.toContain("fast");
  });

  it("toggles tags in the fixed order", () => {
    const offered = tagsFor(1);
    expect(toggleTag(["cold"], "late", offered)).toEqual(["late", "cold"]);
    expect(toggleTag(["late", "cold"], "late", offered)).toEqual(["cold"]);
  });

  it("filters, shares and stars", () => {
    const rows = [r(1, 1, true), r(2, 5, false), r(3, 3, true)];
    expect(filterRatings(rows, "waiting").map((x) => x.id)).toEqual([1, 3]);
    expect(filterRatings(rows, "low").map((x) => x.id)).toEqual([1]);
    expect(filterRatings(rows, "high").map((x) => x.id)).toEqual([2]);
    expect(filterRatings(rows, "all")).toHaveLength(3);
    expect(share(0.625)).toBe("63%");
    expect(share(null)).toBe("—");
    expect(starsText(3)).toBe("★★★☆☆");
  });
});
