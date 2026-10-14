import { describe, expect, it } from "vitest";

import {
  draftToPostDetail,
  hasServerImage,
  pendingPostToCardItem,
  plannedDraftToPostDetail,
  postActions,
  postIsEditable,
  scheduleKind,
  statusMeta,
} from "@/lib/social-post";
import type {
  PendingPost,
  PlanSlot,
  ProductCreative,
  ProductDraft,
  SlotGenerateResult,
  StudioProduct,
} from "@/types/social";

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

describe("postIsEditable / postActions", () => {
  it("treats in_review and changes_requested as editable", () => {
    expect(postIsEditable("in_review")).toBe(true);
    expect(postIsEditable("changes_requested")).toBe(true);
  });

  it("treats every other (and unknown) status as non-editable", () => {
    expect(postIsEditable("approved")).toBe(false);
    expect(postIsEditable("scheduled")).toBe(false);
    expect(postIsEditable("published")).toBe(false);
    expect(postIsEditable("")).toBe(false);
    expect(postIsEditable("mystery")).toBe(false);
  });

  it("exposes decision actions only when editable", () => {
    expect(postActions("in_review")).toEqual({
      canApprove: true,
    });
    expect(postActions("approved")).toEqual({
      canApprove: false,
    });
  });
});

describe("statusMeta", () => {
  it("maps known statuses to a label + tone", () => {
    expect(statusMeta("in_review")).toEqual({ label: "In review", tone: "review" });
    expect(statusMeta("changes_requested")).toEqual({
      label: "Changes requested",
      tone: "changes",
    });
    expect(statusMeta("approved")).toEqual({ label: "Approved", tone: "success" });
    expect(statusMeta("scheduled")).toEqual({ label: "Scheduled", tone: "success" });
    expect(statusMeta("published")).toEqual({ label: "Published", tone: "success" });
  });

  it("degrades an unknown status to a neutral title-cased chip", () => {
    expect(statusMeta("some_new_state")).toEqual({
      label: "Some new state",
      tone: "neutral",
    });
    expect(statusMeta("")).toEqual({ label: "Draft", tone: "neutral" });
  });
});

describe("hasServerImage", () => {
  it("is true when the post already has an image", () => {
    expect(hasServerImage(true, 0)).toBe(true);
  });
  it("is true after a regenerate this session (version bump)", () => {
    expect(hasServerImage(false, 1)).toBe(true);
  });
  it("is false with no image and no regenerate", () => {
    expect(hasServerImage(false, 0)).toBe(false);
  });
});

describe("scheduleKind", () => {
  it("is scheduled once a live date exists", () => {
    expect(
      scheduleKind({ status: "scheduled", scheduledFor: "2026-08-20", plannedFor: null }),
    ).toBe("scheduled");
  });

  it("is planned for an editable post carrying a plannedFor (pre-approval hint)", () => {
    expect(
      scheduleKind({ status: "in_review", scheduledFor: null, plannedFor: "2026-08-20" }),
    ).toBe("planned");
  });

  it("is approved-undated once approved without a date", () => {
    expect(
      scheduleKind({ status: "approved", scheduledFor: null, plannedFor: null }),
    ).toBe("approved-undated");
  });

  it("is none for an editable post with no planned date", () => {
    expect(
      scheduleKind({ status: "in_review", scheduledFor: null, plannedFor: null }),
    ).toBe("none");
  });
});

describe("draftToPostDetail (Content Studio draft → PostDetail)", () => {
  const product: StudioProduct = {
    id: "42",
    name: "LegallyRed Wrap Dress",
    category: "Dresses",
    priceLabel: "$128.00",
    imageUrl: "https://cdn/img.jpg",
    reason: "best_seller",
    reasonDetail: "Top seller last 30 days.",
    suggested: true,
  };
  const draft: ProductDraft = {
    postId: "p1",
    channel: "instagram",
    creative: creative(),
    hasImage: true,
    imageConcept: "Golden-hour rooftop",
  };

  it("maps the draft + product into a full editable PostDetail", () => {
    const detail = draftToPostDetail(draft, product);
    expect(detail).toEqual({
      postId: "p1",
      channel: "instagram",
      productId: 42,
      productName: "LegallyRed Wrap Dress",
      imageUrl: "https://cdn/img.jpg",
      creative: draft.creative,
      caption: "Walks in first.",
      hashtags: ["ExampleStore", "WrapDress"],
      hasImage: true,
      imageConcept: "Golden-hour rooftop",
      status: "in_review",
      scheduledFor: null,
      plannedFor: null,
      // SPEC-168/180/181 — a locally-built Studio draft has never been
      // published, scheduled, or failed to publish.
      permalink: null,
      publishedAt: null,
      postedManually: false,
      externalPostId: null,
      publishError: null,
      scheduledAt: null,
      publishReady: false,
      reason: null,
      reasonDetail: null,
    });
  });

  it("falls back to an empty caption when there are no variants", () => {
    const detail = draftToPostDetail(
      { ...draft, creative: creative({ captionVariants: [] }) },
      product,
    );
    expect(detail.caption).toBe("");
  });
});

describe("plannedDraftToPostDetail (slot generate → PostDetail)", () => {
  const slot: PlanSlot = {
    slotId: 5,
    productId: 77,
    productName: "Coastline Midi",
    imageUrl: "https://cdn/midi.jpg",
    channel: "facebook",
    scheduledDate: "2026-08-20",
    occasion: "Garden ceremony",
    campaignName: "Wedding Guest Week",
    reason: "new_drop",
    reasonDetail: "Dropped 6 days ago.",
    rationale: "Fresh arrival with strong demand signal.",
    postId: 900,
    postStatus: "in_review",
  };
  const result: SlotGenerateResult = {
    post: {
      postId: "900",
      channel: "facebook",
      creative: creative(),
      hasImage: false,
      plannedFor: "2026-08-20",
    },
    slot,
  };

  it("carries the plannedFor + product identity into the detail", () => {
    const detail = plannedDraftToPostDetail(result, slot);
    expect(detail).toMatchObject({
      postId: "900",
      channel: "facebook",
      productId: 77,
      productName: "Coastline Midi",
      imageUrl: "https://cdn/midi.jpg",
      caption: "Walks in first.",
      hasImage: false,
      status: "in_review",
      scheduledFor: null,
      plannedFor: "2026-08-20",
    });
  });
});

describe("pendingPostToCardItem (Approvals view-model)", () => {
  const post: PendingPost = {
    id: "ap1",
    productName: "LegallyRed Wrap Dress",
    channel: "instagram",
    format: "story",
    persona: "The Statement Dresser",
    pillar: "Fit confidence",
    caption: "…",
    hashtags: [],
    estimatedReach: 18400,
    submittedAt: "2026-08-10T17:05:00Z",
    imageUrl: "https://cdn/wrap.jpg",
    hasImage: true,
  };

  it("maps an awaiting-review post to an in_review card item", () => {
    const item = pendingPostToCardItem(post, "Aug 10, 2026");
    expect(item).toEqual({
      postId: "ap1",
      productName: "LegallyRed Wrap Dress",
      channel: "instagram",
      imageUrl: "https://cdn/wrap.jpg",
      hasImage: true,
      status: "in_review",
      subtitle: "Submitted Aug 10, 2026 · The Statement Dresser",
    });
  });

  it("omits the submitted label when none is supplied", () => {
    const item = pendingPostToCardItem(post, "");
    expect(item.subtitle).toBe("The Statement Dresser");
  });
});

describe("why an image wasn't made (SPEC-327)", async () => {
  const { imageFailure } = await import("@/lib/social-post");
  it("shows the backend's own sentence for a limit, and the old text otherwise", () => {
    expect(imageFailure({ reason: "media_limit_reached", detail: "Your package includes 40 images a month." })).toBe(
      "Your package includes 40 images a month.",
    );
    expect(imageFailure({ reason: "media_limit_reached" })).toMatch(/images on your package are used/);
    expect(imageFailure({ reason: "generation_failed", detail: "stack trace" })).toBe("Image generation failed — try again.");
    expect(imageFailure({})).toBe("Couldn't generate the image.");
  });
});
