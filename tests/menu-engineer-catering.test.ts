import { describe, expect, it } from "vitest";

import { addLine, eventLine, quotableDishes, removeLine } from "@/lib/catering";
import { byKind, pct } from "@/lib/menu-engineer";
import type { BranchMenu, CateringInquiry, MenuSuggestion } from "@/types/restaurant-os";

const s = (kind: MenuSuggestion["kind"]): MenuSuggestion => ({
  menuItemId: 1,
  name: "x",
  category: "Pizza",
  kind,
  class: "dog",
  text: "",
  units: 1,
  price: 10,
  foodCostPct: 0.38,
  newPrice: null,
  worth: null,
});

describe("menu engineer", () => {
  it("filters by kind and words food cost", () => {
    expect(byKind([s("reprice"), s("retire")], "retire")).toHaveLength(1);
    expect(byKind([s("reprice"), s("retire")], "all")).toHaveLength(2);
    expect(pct(0.384)).toBe("38%");
    expect(pct(null)).toBe("—");
  });
});

describe("catering", () => {
  it("builds draft lines", () => {
    let lines = addLine([], 3, 2);
    lines = addLine(lines, 3, 5);
    lines = addLine(lines, 4, 0);
    expect(lines).toEqual([
      { menuItemId: 3, quantity: 7 },
      { menuItemId: 4, quantity: 1 },
    ]);
    expect(removeLine(lines, 3)).toEqual([{ menuItemId: 4, quantity: 1 }]);
    expect(addLine([], 9, 5000)[0].quantity).toBe(1000);
  });

  it("lists available dishes and words the event", () => {
    const menu = {
      branchId: 1,
      sections: [
        {
          categoryId: 1,
          name: "Pizza",
          items: [
            { id: 1, name: "Cheese", available: true },
            { id: 2, name: "Gone", available: false },
          ],
        },
      ],
    } as unknown as BranchMenu;
    expect(quotableDishes(menu)).toEqual([{ id: 1, name: "Cheese", section: "Pizza" }]);
    expect(quotableDishes(undefined)).toEqual([]);
    const inquiry = { eventDate: "2026-10-23", eventTime: "12:30", guests: 30, fulfilment: "delivery" } as CateringInquiry;
    expect(eventLine(inquiry)).toBe("Fri, Oct 23 · 12:30 · 30 guests · delivery");
  });
});
