import { describe, expect, it } from "vitest";

import { LEAD_PARAGRAPH_CLASS, isLeadBlock, tailIsLead } from "@/lib/chat-lead";

/**
 * SPEC-222. The reply's opening sentence is the answer; everything under it is
 * evidence. The risk while streaming is that the promotion slides down the reply
 * as more blocks complete, so these pin which block owns it at each stage.
 */
describe("isLeadBlock", () => {
  it("promotes the first completed block", () => {
    expect(isLeadBlock(0, 3)).toBe(true);
  });

  it("never promotes a later block", () => {
    expect(isLeadBlock(1, 3)).toBe(false);
    expect(isLeadBlock(2, 3)).toBe(false);
  });

  it("does not promote a block when none has completed", () => {
    // The tail owns the sentence at this point, not block 0.
    expect(isLeadBlock(0, 0)).toBe(false);
  });
});

describe("tailIsLead", () => {
  it("promotes the live tail before any block completes", () => {
    expect(tailIsLead(0)).toBe(true);
  });

  it("hands the promotion over once the first block completes", () => {
    expect(tailIsLead(1)).toBe(false);
    expect(tailIsLead(5)).toBe(false);
  });

  it("never promotes both the tail and a block at the same time", () => {
    for (const stable of [0, 1, 2, 7]) {
      const promoted = [tailIsLead(stable), isLeadBlock(0, stable)].filter(Boolean);
      expect(promoted.length).toBe(1);
    }
  });
});

describe("LEAD_PARAGRAPH_CLASS", () => {
  it("targets only the first paragraph", () => {
    expect(LEAD_PARAGRAPH_CLASS).toContain("p:first-child");
  });

  it("uses semantic tokens, never a hardcoded colour (root Rule 9)", () => {
    expect(LEAD_PARAGRAPH_CLASS).toContain("text-foreground");
    expect(LEAD_PARAGRAPH_CLASS).not.toMatch(/#[0-9a-f]{3,6}/i);
    expect(LEAD_PARAGRAPH_CLASS).not.toContain("brand");
  });

  it("is larger than the body copy it sits above", () => {
    // Body is text-sm; the lead must outrank it.
    expect(LEAD_PARAGRAPH_CLASS).toContain("text-base");
    expect(LEAD_PARAGRAPH_CLASS).toContain("font-medium");
  });
});
