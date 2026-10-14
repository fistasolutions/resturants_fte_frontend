import { describe, expect, it } from "vitest";

import {
  REFINE_INSTRUCTION_MAX_LENGTH,
  REFINE_SUGGESTIONS,
  refineInstructionError,
  refinedPostSeed,
} from "@/lib/social-post";
import type { PostDetail, ProductCreative } from "@/types/social";

function creative(over: Partial<ProductCreative> = {}): ProductCreative {
  return {
    persona: "The Statement Dresser",
    pillar: "Fit confidence",
    frames: [],
    captionVariants: [
      { id: "v1", angle: "Confident", body: "Walks in first." },
      { id: "v2", angle: "Playful", body: "You know what to do." },
    ],
    hashtags: ["ExampleStore", "WrapDress"],
    ...over,
  };
}

function postDetail(over: Partial<PostDetail> = {}): PostDetail {
  return {
    postId: "p1",
    channel: "instagram",
    productId: 42,
    productName: "LegallyRed Wrap Dress",
    imageUrl: "https://cdn/img.jpg",
    creative: creative(),
    caption: "Walks in first.",
    hashtags: ["ExampleStore", "WrapDress"],
    hasImage: true,
    imageConcept: "Golden-hour rooftop",
    status: "in_review",
    scheduledFor: null,
    plannedFor: null,
    permalink: null,
    publishedAt: null,
    postedManually: false,
    externalPostId: null,
    publishError: null,
    scheduledAt: null,
    publishReady: false,
    reason: null,
    reasonDetail: null,
    ...over,
  };
}

describe("refineInstructionError", () => {
  it("rejects an empty or whitespace-only instruction", () => {
    expect(refineInstructionError("")).toMatch(/change/i);
    expect(refineInstructionError("   \n\t ")).toMatch(/change/i);
  });

  it("accepts a normal instruction (returns null)", () => {
    expect(refineInstructionError("Make it punchier")).toBeNull();
  });

  it("trims before validating so surrounding whitespace is fine", () => {
    expect(refineInstructionError("  Shorter please  ")).toBeNull();
  });

  it("rejects an instruction longer than the max (by trimmed length)", () => {
    const tooLong = "x".repeat(REFINE_INSTRUCTION_MAX_LENGTH + 1);
    expect(refineInstructionError(tooLong)).toMatch(/2000/);
  });

  it("accepts an instruction exactly at the max length", () => {
    const atLimit = "x".repeat(REFINE_INSTRUCTION_MAX_LENGTH);
    expect(refineInstructionError(atLimit)).toBeNull();
  });
});

describe("REFINE_SUGGESTIONS", () => {
  it("offers the four prompt chips, non-empty", () => {
    expect(REFINE_SUGGESTIONS).toEqual([
      "Make it punchier",
      "Shorter",
      "Lean into the occasion",
      "Less salesy",
    ]);
    // Every chip must itself pass validation (they pre-fill the textarea).
    for (const suggestion of REFINE_SUGGESTIONS) {
      expect(refineInstructionError(suggestion)).toBeNull();
    }
  });
});

describe("refinedPostSeed", () => {
  it("seeds from the first caption variant and carries status/image/schedule", () => {
    const seed = refinedPostSeed(
      postDetail({
        status: "changes_requested",
        hasImage: false,
        imageConcept: null,
        scheduledFor: "2026-08-25",
      }),
    );
    expect(seed).toEqual({
      creative: expect.objectContaining({ persona: "The Statement Dresser" }),
      variantId: "v1",
      caption: "Walks in first.",
      status: "changes_requested",
      hasImage: false,
      imageConcept: null,
      scheduledFor: "2026-08-25",
    });
  });

  it("falls back to the post caption + null variant when there are no variants", () => {
    const seed = refinedPostSeed(
      postDetail({
        creative: creative({ captionVariants: [] }),
        caption: "Standalone caption.",
      }),
    );
    expect(seed.variantId).toBeNull();
    expect(seed.caption).toBe("Standalone caption.");
  });

  it("does not mutate the input post", () => {
    const post = postDetail();
    const before = JSON.stringify(post);
    refinedPostSeed(post);
    expect(JSON.stringify(post)).toBe(before);
  });
});
