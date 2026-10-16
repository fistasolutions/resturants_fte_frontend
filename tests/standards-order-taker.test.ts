import { describe, expect, it } from "vitest";

import { canSend, proposalToCart } from "@/lib/order-taker";
import { answersOf, emptyDraft, sections, unanswered } from "@/lib/standards";
import type { AuditPoint } from "@/types/restaurant-os";

const points: AuditPoint[] = [
  { key: "a", section: "quality", sectionLabel: "Quality", text: "A" },
  { key: "b", section: "quality", sectionLabel: "Quality", text: "B" },
  { key: "c", section: "service", sectionLabel: "Service", text: "C" },
];

describe("standards", () => {
  it("groups points and only lets a complete visit through", () => {
    expect(sections(points).map((s) => [s.label, s.points.length])).toEqual([
      ["Quality", 2],
      ["Service", 1],
    ]);
    const draft = emptyDraft(points);
    expect(unanswered(draft)).toBe(3);
    expect(answersOf(draft)).toBeNull();
    draft.a = { result: "pass", note: "" };
    draft.b = { result: "fail", note: " cold oven " };
    draft.c = { result: "not_seen", note: "" };
    expect(answersOf(draft)).toEqual({
      a: { result: "pass", note: null },
      b: { result: "fail", note: "cold oven" },
      c: { result: "not_seen", note: null },
    });
  });
});

describe("order taker", () => {
  it("limits sending and turns a proposal into checkout lines", () => {
    expect(canSend([], " hi ")).toBe(true);
    expect(canSend([], "   ")).toBe(false);
    expect(canSend([], "x".repeat(501))).toBe(false);
    expect(canSend(Array.from({ length: 20 }, () => ({ role: "user" as const, content: "x" })), "more")).toBe(false);
    const lines = proposalToCart(
      { channel: "carryout", lines: [{ itemId: 3, sizeId: 4, quantity: 2, modifiers: [{ optionId: 9 }] }] },
      { subtotal: 30, lines: [{ name: "Build Your Own", quantity: 2, lineTotal: 30, modifiers: [{ name: "Pepperoni" }] }] },
      "t",
    );
    expect(lines).toEqual([
      {
        key: "ot-t-0",
        itemId: 3,
        sizeId: 4,
        quantity: 2,
        modifiers: [{ optionId: 9, portion: "whole", amount: "regular" }],
        note: null,
        label: "Build Your Own",
        detail: "Pepperoni",
      },
    ]);
  });
});
