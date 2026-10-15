/** Frontend SPEC-379 — Restaurant OS screens' pure half: kitchen stages, ticket age, the item
 * builder, reorders, request bodies, the tracker's steps and opening hours. */
import { describe, expect, it } from "vitest";

import {
  builderDefaults,
  builderProblems,
  cartLine,
  columnOf,
  describeModifiers,
  hoursFromText,
  hoursToText,
  isLate,
  minutesSince,
  nextStage,
  orderBody,
  reorderLines,
  toggleSelection,
  trackSteps,
} from "@/lib/restaurant-os";
import type { MenuEntry, StageTimes } from "@/types/restaurant-os";

const PIZZA: MenuEntry = {
  id: 1,
  name: "Pizza",
  categoryId: 1,
  category: "Pizza",
  kind: "pizza",
  price: 0,
  available: true,
  sizes: [
    { id: 10, name: "Medium", price: 12, available: false },
    { id: 11, name: "Large", price: 15, available: true },
  ],
  groups: [
    {
      id: 100,
      name: "Toppings",
      kind: "toppings",
      minSelect: 0,
      maxSelect: 5,
      allowHalves: true,
      allowAmounts: true,
      freeQuantity: 0,
      options: [
        { id: 1, name: "Cheese", price: 1, sizePrices: {}, isDefault: true, available: true },
        { id: 2, name: "Pepperoni", price: 1.5, sizePrices: { Large: 2 }, isDefault: false, available: true },
      ],
    },
    {
      id: 200,
      name: "Crust",
      kind: "choice",
      minSelect: 1,
      maxSelect: 1,
      allowHalves: false,
      allowAmounts: false,
      freeQuantity: 0,
      options: [
        { id: 21, name: "Thin", price: 0, sizePrices: {}, isDefault: false, available: true },
        { id: 22, name: "Stuffed", price: 2, sizePrices: {}, isDefault: false, available: true },
      ],
    },
  ],
};

describe("the kitchen", () => {
  it("offers one bump per stage, and hands ready deliveries to dispatch", () => {
    expect(nextStage("received", "delivery")?.to).toBe("accepted");
    expect(nextStage("baking", "carryout")?.to).toBe("ready");
    expect(nextStage("ready", "carryout")?.to).toBe("picked_up");
    expect(nextStage("ready", "delivery")).toBeNull();
    expect(nextStage("out_for_delivery", "delivery")?.to).toBe("delivered");
    expect(nextStage("picked_up", "carryout")).toBeNull();
  });

  it("puts each stage in its column", () => {
    expect(columnOf("accepted")).toBe("new");
    expect(columnOf("baking")).toBe("oven");
    expect(columnOf("out_for_delivery")).toBeNull();
  });

  it("knows a ticket's age and when it is late", () => {
    expect(minutesSince("2026-10-15T12:00:00Z", "2026-10-15T12:17:30Z")).toBe(17);
    const order = { stage: "baking" as const, channel: "carryout" as const, quotedReadyAt: "2026-10-15T12:20:00Z", quotedDeliveryAt: null };
    expect(isLate(order, "2026-10-15T12:19:00Z")).toBe(false);
    expect(isLate(order, "2026-10-15T12:21:00Z")).toBe(true);
    expect(isLate({ ...order, stage: "picked_up" }, "2026-10-15T13:00:00Z")).toBe(false);
  });
});

describe("the item builder", () => {
  it("opens on the first available size, the included toppings and the first required choice", () => {
    expect(builderDefaults(PIZZA)).toEqual({
      sizeId: 11,
      selections: [
        { optionId: 1, portion: "whole", amount: "regular" },
        { optionId: 21, portion: "whole", amount: "regular" },
      ],
    });
  });

  it("toggles toppings and swaps a single choice", () => {
    const start = builderDefaults(PIZZA).selections;
    const added = toggleSelection(PIZZA, start, 2);
    expect(added.map((s) => s.optionId)).toEqual([1, 21, 2]);
    const crust = toggleSelection(PIZZA, added, 22);
    expect(crust.map((s) => s.optionId)).toEqual([1, 2, 22]);
    expect(toggleSelection(PIZZA, crust, 2).map((s) => s.optionId)).toEqual([1, 22]);
  });

  it("names what is still missing", () => {
    expect(builderProblems(PIZZA, null, [])).toEqual(["Choose a size.", "Choose a crust."]);
    expect(builderProblems(PIZZA, 11, builderDefaults(PIZZA).selections)).toEqual([]);
  });

  it("builds a cart line with a readable label", () => {
    const line = cartLine(PIZZA, 11, [{ optionId: 2, portion: "left", amount: "extra" }, { optionId: 21, portion: "whole", amount: "regular" }], 2, "  cut in squares ");
    expect(line.label).toBe("Large Pizza");
    expect(line.detail).toBe("Extra pepperoni (left half), Thin");
    expect(line.note).toBe("cut in squares");
    expect(line.quantity).toBe(2);
  });

  it("describes modifiers", () => {
    expect(describeModifiers([{ name: "Mushrooms", portion: "whole", amount: "light" }])).toBe("Light mushrooms");
  });
});

describe("reorder", () => {
  it("keeps only what is still on the menu", () => {
    const lines = reorderLines(
      {
        id: 9,
        placedAt: "2026-10-01T18:00:00Z",
        channel: "delivery",
        total: 20,
        lines: [
          { menuItemId: 1, name: "Large Pizza", quantity: 1, modifiers: [{ optionId: 2, name: "Pepperoni", portion: "whole", amount: "regular" }, { optionId: 99, name: "Gone", portion: "whole", amount: "regular" }] },
          { menuItemId: 1, name: "Medium Pizza", quantity: 1, modifiers: [] },
          { menuItemId: 404, name: "Old item", quantity: 1, modifiers: [] },
        ],
      },
      [PIZZA],
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].modifiers.map((m) => m.optionId)).toEqual([2]);
    expect(lines[0].sizeId).toBe(11);
  });
});

describe("request bodies", () => {
  it("snake-cases the order", () => {
    const body = orderBody({
      branchId: 3,
      channel: "delivery",
      lines: [cartLine(PIZZA, 11, [{ optionId: 2, portion: "right", amount: "regular" }], 1, null)],
      customerPhone: "555",
      address: { line1: "1 Main", postalCode: "12345" },
      paymentMethod: "card_on_delivery",
    });
    expect(body).toMatchObject({
      branch_id: 3,
      channel: "delivery",
      lines: [{ item_id: 1, size_id: 11, quantity: 1, modifiers: [{ option_id: 2, portion: "right", amount: "regular" }] }],
      customer_phone: "555",
      address: { line1: "1 Main", postal_code: "12345" },
      payment_method: "card_on_delivery",
    });
  });
});

describe("the tracker", () => {
  const times: StageTimes = { received: "a", accepted: "b", baking: "c", ready: null, outForDelivery: null, delivered: null, completed: null, cancelled: null };

  it("marks the steps done and the current one", () => {
    const steps = trackSteps({ stage: "baking", channel: "delivery", times });
    expect(steps.map((s) => s.key)).toEqual(["placed", "make", "bake", "out", "done"]);
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false, false]);
    expect(steps[2].current).toBe(true);
    const pickup = trackSteps({ stage: "picked_up", channel: "carryout", times });
    expect(pickup.map((s) => s.key)).toContain("ready");
    expect(pickup.every((s) => s.done)).toBe(true);
  });
});

describe("opening hours", () => {
  it("round-trips the editor's text", () => {
    expect(hoursToText({ "0": [["11:00", "14:00"], ["17:00", "23:00"]] })).toEqual({ "0": "11:00-14:00, 17:00-23:00" });
    expect(hoursFromText({})).toEqual({});
    const parsed = hoursFromText({ "0": "9:00-14:00", "4": "17:00 - 02:00" });
    expect(parsed?.["0"]).toEqual([["09:00", "14:00"]]);
    expect(parsed?.["4"]).toEqual([["17:00", "02:00"]]);
    expect(parsed?.["1"]).toEqual([]);
    expect(hoursFromText({ "0": "lunchtime" })).toBeNull();
  });
});
