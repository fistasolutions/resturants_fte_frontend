import { describe, expect, it } from "vitest";

import {
  CAPTION_LIMITS,
  captionCount,
  captionLimit,
  captionSaveBlocked,
  channelsForSelection,
  draftsForSelection,
  findVariant,
  sortStudioPosts,
} from "@/lib/social-studio";
import { mockContentStudio } from "@/lib/mock/social";
import type { GeneratedPost, ProductCreative } from "@/types/social";

/** Build a GeneratedPost fixture from the mock catalog's first product creative. */
function post(channel: string, id = channel): GeneratedPost {
  return {
    postId: `post-${id}`,
    channel,
    creative: mockContentStudio.products[0].creative,
    hasImage: false,
  };
}

describe("channelsForSelection (SPEC-133 channel selector → requested channels)", () => {
  it("maps a single-platform selection to exactly that channel", () => {
    expect(channelsForSelection("instagram")).toEqual(["instagram"]);
    expect(channelsForSelection("facebook")).toEqual(["facebook"]);
  });

  it("maps 'both' to Instagram and Facebook, in order", () => {
    expect(channelsForSelection("both")).toEqual(["instagram", "facebook"]);
  });
});

describe("captionLimit / captionCount (per-platform character counting)", () => {
  it("uses the platform soft limits", () => {
    expect(captionLimit("instagram")).toBe(2200);
    expect(captionLimit("facebook")).toBe(63206);
    expect(CAPTION_LIMITS.instagram).toBe(2200);
  });

  it("falls back to the Instagram limit for unknown channels", () => {
    expect(captionLimit("tiktok")).toBe(2200);
    expect(captionLimit("")).toBe(2200);
  });

  it("counts characters and computes remaining", () => {
    const c = captionCount("instagram", "hello");
    expect(c.count).toBe(5);
    expect(c.limit).toBe(2200);
    expect(c.remaining).toBe(2195);
    expect(c.over).toBe(false);
  });

  it("counts emoji as a single code point (not two UTF-16 units)", () => {
    // A rocket emoji is a surrogate pair — code-point counting yields 1.
    expect(captionCount("instagram", "🚀").count).toBe(1);
    expect(captionCount("instagram", "ab🚀").count).toBe(3);
  });

  it("marks over-limit strictly past the limit (== limit is allowed)", () => {
    const atLimit = "x".repeat(2200);
    const overLimit = "x".repeat(2201);
    expect(captionCount("instagram", atLimit).over).toBe(false);
    expect(captionCount("instagram", atLimit).remaining).toBe(0);
    expect(captionCount("instagram", overLimit).over).toBe(true);
    expect(captionCount("instagram", overLimit).remaining).toBe(-1);
  });

  it("gives Facebook a far larger allowance than Instagram", () => {
    const long = "x".repeat(3000);
    expect(captionCount("instagram", long).over).toBe(true);
    expect(captionCount("facebook", long).over).toBe(false);
  });
});

describe("captionSaveBlocked (only empty is a hard block)", () => {
  it("blocks empty / whitespace-only captions", () => {
    expect(captionSaveBlocked("")).toBe(true);
    expect(captionSaveBlocked("   \n\t ")).toBe(true);
  });

  it("allows normal and over-limit captions (over-limit is a gentle warning)", () => {
    expect(captionSaveBlocked("A real caption.")).toBe(false);
    expect(captionSaveBlocked("x".repeat(5000))).toBe(false);
  });
});

describe("sortStudioPosts (side-by-side ordering)", () => {
  it("orders Instagram before Facebook regardless of input order", () => {
    const sorted = sortStudioPosts([post("facebook"), post("instagram")]);
    expect(sorted.map((p) => p.channel)).toEqual(["instagram", "facebook"]);
  });

  it("keeps a single post untouched and does not mutate the input", () => {
    const input = [post("facebook")];
    const sorted = sortStudioPosts(input);
    expect(sorted.map((p) => p.channel)).toEqual(["facebook"]);
    expect(input.map((p) => p.channel)).toEqual(["facebook"]); // not mutated
  });
});

describe("findVariant (angle switcher lookup)", () => {
  const creative: ProductCreative = mockContentStudio.products[0].creative;

  it("returns the matching variant by id", () => {
    const target = creative.captionVariants[1];
    expect(findVariant(creative, target.id)).toEqual(target);
  });

  it("falls back to the first variant for an unknown or null id", () => {
    expect(findVariant(creative, "does-not-exist")).toEqual(creative.captionVariants[0]);
    expect(findVariant(creative, null)).toEqual(creative.captionVariants[0]);
  });

  it("returns null when there are no variants", () => {
    const empty: ProductCreative = { ...creative, captionVariants: [] };
    expect(findVariant(empty, null)).toBeNull();
  });
});

describe("draftsForSelection — the toggle filters the view", () => {
  const ig = { channel: "instagram", postId: 1 };
  const fb = { channel: "facebook", postId: 2 };

  it("shows only the selected channel's draft", () => {
    // The bug this fixes: switching to Instagram left the Facebook draft on
    // screen, so the toggle looked broken.
    expect(draftsForSelection([ig, fb], "instagram")).toEqual([ig]);
    expect(draftsForSelection([ig, fb], "facebook")).toEqual([fb]);
  });

  it("shows nothing when the selected channel has no draft yet", () => {
    // Empty is correct — the studio then offers to generate for that channel
    // rather than showing the other channel's work.
    expect(draftsForSelection([fb], "instagram")).toEqual([]);
  });

  it("shows both, in channel order, when Both is selected", () => {
    expect(draftsForSelection([ig, fb], "both")).toEqual([ig, fb]);
  });

  it("keeps null distinct from empty so hydrating never looks like 'none'", () => {
    // null = still loading; [] = loaded and genuinely nothing for this channel.
    expect(draftsForSelection(null, "both")).toBeNull();
  });

  it("ignores drafts on channels that are not selected at all", () => {
    const stray = { channel: "tiktok", postId: 3 };
    expect(draftsForSelection([ig, stray], "instagram")).toEqual([ig]);
  });
});
