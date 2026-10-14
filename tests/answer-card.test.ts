import { describe, expect, it } from "vitest";

import { answerLinks, chipPrefix, groundedPill, runtimeLabel } from "@/lib/answer-card";
import type { ChatSources } from "@/types/chat";

const grounded: ChatSources = {
  grounded: true,
  systems: ["Shopify", "Loop Returns"],
  tools: ["get_inventory_alerts", "get_returns_summary"],
  chips: [],
};

describe("groundedPill", () => {
  it("names the systems when the answer ran tools", () => {
    expect(groundedPill(grounded, false)).toEqual({ tone: "ok", label: "Grounded · Shopify, Loop Returns" });
  });

  it("says so when nothing was read, and while streaming", () => {
    expect(groundedPill({ grounded: false, systems: [], tools: [], chips: [] }, false)).toEqual({
      tone: "muted",
      label: "Conversational · no records read",
    });
    expect(groundedPill(null, false).tone).toBe("muted");
    expect(groundedPill(null, true)).toEqual({ tone: "working", label: "Reading records…" });
  });
});

describe("runtimeLabel", () => {
  it("prefers the override, falls back to the default, and shows the temperature", () => {
    expect(runtimeLabel("gemini/gemini-3.6-flash", 0.2, "gemini/gemini-pro-latest")).toBe(
      "Runtime · Gemini 3.6 Flash · t 0.2",
    );
    expect(runtimeLabel(null, null, "gemini/gemini-pro-latest")).toBe("Runtime · Gemini Pro (latest)");
    expect(runtimeLabel(null, null, null)).toBe("Runtime · Glisp");
  });
});

describe("chipPrefix", () => {
  it("labels each chip kind for the reader", () => {
    expect(chipPrefix("page")).toBe("Page");
    expect(chipPrefix("product")).toBe("Product");
    expect(chipPrefix("order")).toBe("Order");
    expect(chipPrefix("location")).toBe("Store");
  });
});

describe("answerLinks (SPEC-352)", () => {
  it("merges actions and link cards: in-app only, one per href, actions first", () => {
    const sources: ChatSources = {
      grounded: true,
      systems: [],
      tools: [],
      chips: [],
      actions: [
        { label: "Open the payment run", href: "/employees/finance?tab=run", kind: "review" },
        { label: "Send overdue lists", href: "/orders/review", kind: "send" },
        { label: "Elsewhere", href: "https://example.com", kind: "review" },
        { label: "Sneaky", href: "//example.com", kind: "review" },
      ],
      cards: [
        { kind: "link", label: "Open approvals", href: "/customer-support?tab=approvals" },
        { kind: "link", href: "/customer-support?tab=insights" },
        { kind: "link", label: "Duplicate", href: "/orders/review" },
        { kind: "link", label: "Evil", href: "https://example.com" },
        { kind: "generation", job_id: 4 },
      ],
    };
    expect(answerLinks(sources)).toEqual([
      { label: "Open the payment run", href: "/employees/finance?tab=run", kind: "review" },
      { label: "Send overdue lists", href: "/orders/review", kind: "send" },
      { label: "Open approvals", href: "/customer-support?tab=approvals", kind: "review" },
      { label: "Open", href: "/customer-support?tab=insights", kind: "review" },
    ]);
  });

  it("is empty without sources", () => {
    expect(answerLinks(null)).toEqual([]);
    expect(answerLinks(undefined)).toEqual([]);
  });
});
