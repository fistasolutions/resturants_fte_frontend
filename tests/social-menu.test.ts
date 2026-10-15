import { describe, expect, it } from "vitest";

import { menuByReason, menuItemsToStudio } from "@/lib/social-menu";

const items = [
  { id: 3, name: "Pepperoni", category: "Pizza", priceLabel: "$15.00", reason: "best_seller", reasonDetail: "#1", units30d: 40 },
  { id: 9, name: "Wings", category: "Wings", priceLabel: "$12.00", reason: "profit_pick", reasonDetail: "Earns", units30d: 2 },
];

describe("social menu", () => {
  it("turns dishes into studio items, suggesting the top best seller", () => {
    const studio = menuItemsToStudio(items);
    expect(studio[0]).toEqual({
      id: "3",
      name: "Pepperoni",
      category: "Pizza",
      priceLabel: "$15.00",
      imageUrl: null,
      reason: "best_seller",
      reasonDetail: "#1",
      suggested: true,
    });
    expect(studio[1].suggested).toBe(false);
    expect(menuByReason(studio, "profit_pick").map((i) => i.id)).toEqual(["9"]);
    expect(menuByReason(studio, "all")).toHaveLength(2);
    expect(menuItemsToStudio([items[1]])[0].suggested).toBe(false);
  });
});
