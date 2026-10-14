import { describe, expect, it } from "vitest";

import {
  appendProgressPhase,
  headingIdsByLine,
  planBlogGalleries,
  planL5Flow,
  resolveHeroImage,
  splitBodyIntoSections,
  type BlogFlowItem,
  type L5FlowItem,
} from "@/lib/spotlight";
import type { BlogDraftProduct } from "@/types/spotlight";

// Pure, node-safe: the premium magazine-layout planners (SPEC-150). Sections are
// split off the reading body (FAQ already lifted by splitBodyFaq); galleries are
// woven from the real grounded product images so prose and photography alternate.

function product(id: number, hasImage = true): BlogDraftProduct {
  return {
    productId: id,
    title: `Product ${id}`,
    handle: `product-${id}`,
    imageUrl: hasImage ? `https://cdn.shopify.com/p${id}.jpg` : null,
    url: `/products/product-${id}`,
  };
}

/** Flatten a plan back to the products it would show, in order. */
function galleriedProductIds(flow: BlogFlowItem[]): number[] {
  return flow
    .filter((item): item is Extract<BlogFlowItem, { kind: "gallery" }> => item.kind === "gallery")
    .flatMap((item) => item.products.map((p) => p.productId));
}

function sectionIds(flow: BlogFlowItem[]): string[] {
  return flow
    .filter((item): item is Extract<BlogFlowItem, { kind: "section" }> => item.kind === "section")
    .map((item) => item.section.id);
}

describe("splitBodyIntoSections", () => {
  const BODY = [
    "Intro paragraph one.",
    "",
    "Intro paragraph two.",
    "",
    "## Why one wardrobe",
    "",
    "Great everywhere.",
    "",
    "## How to style it",
    "",
    "Layer it up.",
  ].join("\n");

  it("splits the intro out and one section per ## H2 (body keeps the heading)", () => {
    const { intro, sections } = splitBodyIntoSections(BODY);
    expect(intro).toBe("Intro paragraph one.\n\nIntro paragraph two.");
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Why one wardrobe");
    expect(sections[0].body).toContain("## Why one wardrobe");
    expect(sections[0].body).toContain("Great everywhere.");
    expect(sections[0].body).not.toContain("How to style it");
    expect(sections[1].body).toContain("## How to style it");
    expect(sections[1].body).toContain("Layer it up.");
  });

  it("gives sections ids that match headingIdsByLine (same dedup + order)", () => {
    const { sections } = splitBodyIntoSections(BODY);
    expect(sections.map((s) => s.id)).toEqual(["why-one-wardrobe", "how-to-style-it"]);

    const dupBody = ["## Fit", "", "a", "", "## Fit", "", "b", "", "## Care"].join("\n");
    const { sections: dup } = splitBodyIntoSections(dupBody);
    expect(dup.map((s) => s.id)).toEqual(["fit", "fit-1", "care"]);
    // Same ids the in-body renderer would stamp, keyed off source lines.
    const byLine = headingIdsByLine(dupBody);
    expect([...byLine.values()]).toEqual(["fit", "fit-1", "care"]);
  });

  it("treats a body with no H2 as pure intro", () => {
    const { intro, sections } = splitBodyIntoSections("Just prose.\n\nMore prose.");
    expect(intro).toBe("Just prose.\n\nMore prose.");
    expect(sections).toEqual([]);
  });

  it("handles an empty body", () => {
    expect(splitBodyIntoSections("")).toEqual({ intro: "", sections: [] });
  });
});

describe("planBlogGalleries", () => {
  const sections = splitBodyIntoSections(
    ["## A", "", "a", "", "## B", "", "b", "", "## C", "", "c", "", "## D", "", "d"].join("\n"),
  ).sections;

  it("returns sections unchanged when no product has an image", () => {
    const flow = planBlogGalleries(sections, [product(1, false), product(2, false)]);
    expect(flow.every((item) => item.kind === "section")).toBe(true);
    expect(sectionIds(flow)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns sections unchanged when there are no products at all", () => {
    const flow = planBlogGalleries(sections, []);
    expect(flow.every((item) => item.kind === "section")).toBe(true);
  });

  it("places every image and preserves every section in document order", () => {
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planBlogGalleries(sections, products);
    // All four sections still present, in order.
    expect(sectionIds(flow)).toEqual(["a", "b", "c", "d"]);
    // Every image ends up in a gallery exactly once, in order.
    expect(galleriedProductIds(flow).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
    // Woven in, not all dumped at one end: a gallery precedes some section.
    expect(flow[0].kind).toBe("gallery");
  });

  it("only galleries image-bearing products (skips image-less ones)", () => {
    const products = [product(1), product(2, false), product(3)];
    const flow = planBlogGalleries(sections, products);
    expect(galleriedProductIds(flow).sort((x, y) => x - y)).toEqual([1, 3]);
  });

  it("caps the number of galleries by maxGalleries", () => {
    const products = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => product(id));
    const flow = planBlogGalleries(sections, products, { maxGalleries: 2, maxPerGallery: 2 });
    const galleries = flow.filter((item) => item.kind === "gallery");
    expect(galleries).toHaveLength(2);
    // Still never loses an image.
    expect(galleriedProductIds(flow)).toHaveLength(9);
  });

  it("caps the number of galleries by the section count", () => {
    const oneSection = splitBodyIntoSections("## Only\n\nx").sections;
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planBlogGalleries(oneSection, products);
    expect(flow.filter((item) => item.kind === "gallery")).toHaveLength(1);
    expect(galleriedProductIds(flow)).toHaveLength(6);
  });

  it("degrades to a single gallery for one image", () => {
    const flow = planBlogGalleries(sections, [product(7)]);
    const galleries = flow.filter((item) => item.kind === "gallery");
    expect(galleries).toHaveLength(1);
    // First section slot, i.e. right after the intro.
    expect(flow[0].kind).toBe("gallery");
  });

  it("emits galleries alone when there are images but no sections", () => {
    const flow = planBlogGalleries([], [product(1), product(2), product(3), product(4)]);
    expect(flow.every((item) => item.kind === "gallery")).toBe(true);
    expect(galleriedProductIds(flow).sort((x, y) => x - y)).toEqual([1, 2, 3, 4]);
  });

  it("respects maxPerGallery when splitting bands", () => {
    const products = [1, 2, 3, 4].map((id) => product(id));
    const flow = planBlogGalleries(sections, products, { maxPerGallery: 2 });
    const galleries = flow.filter(
      (item): item is Extract<BlogFlowItem, { kind: "gallery" }> => item.kind === "gallery",
    );
    expect(galleries.every((g) => g.products.length <= 2)).toBe(true);
  });
});

// The Minimal-Luxury (L5) reading flow (SPEC-153): reuses planBlogGalleries and
// promotes exactly one section into an image/text split.
describe("planL5Flow", () => {
  const FOUR = ["## A", "", "a", "", "## B", "", "b", "", "## C", "", "c", "", "## D", "", "d"].join(
    "\n",
  );
  const sections = splitBodyIntoSections(FOUR).sections;

  function splitItems(flow: L5FlowItem[]) {
    return flow.filter(
      (item): item is Extract<L5FlowItem, { kind: "split" }> => item.kind === "split",
    );
  }
  function sectionItemIds(flow: L5FlowItem[]): string[] {
    return flow
      .filter((item): item is Extract<L5FlowItem, { kind: "section" }> => item.kind === "section")
      .map((item) => item.section.id);
  }
  function galleryProductIds(flow: L5FlowItem[]): number[] {
    return flow
      .filter((item): item is Extract<L5FlowItem, { kind: "gallery" }> => item.kind === "gallery")
      .flatMap((item) => item.products.map((p) => p.productId));
  }

  it("returns pure sections (no split, no gallery) when no product has an image", () => {
    const flow = planL5Flow(sections, [product(1, false), product(2, false)]);
    expect(flow.every((item) => item.kind === "section")).toBe(true);
    expect(sectionItemIds(flow)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns galleries alone (no split) when there are images but no sections", () => {
    const flow = planL5Flow([], [product(1), product(2), product(3)]);
    expect(splitItems(flow)).toHaveLength(0);
    expect(flow.every((item) => item.kind === "gallery")).toBe(true);
    expect(galleryProductIds(flow).sort((x, y) => x - y)).toEqual([1, 2, 3]);
  });

  it("promotes exactly one section into an image/text split", () => {
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planL5Flow(sections, products);
    const splits = splitItems(flow);
    expect(splits).toHaveLength(1);
    // The split's product carries a real image (never invented; Rule 8).
    expect(splits[0].product.imageUrl).toBeTruthy();
    // The split's section is one of the article's sections.
    expect(["a", "b", "c", "d"]).toContain(splits[0].section.id);
  });

  it("represents every section exactly once (as a section OR the split, never both)", () => {
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planL5Flow(sections, products);
    const splitId = splitItems(flow)[0].section.id;
    const rendered = [...sectionItemIds(flow), splitId].sort();
    expect(rendered).toEqual(["a", "b", "c", "d"]);
    // The promoted section is NOT also rendered as a plain section item.
    expect(sectionItemIds(flow)).not.toContain(splitId);
  });

  it("places every imaged product exactly once across galleries + the split", () => {
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planL5Flow(sections, products);
    const splitProductId = splitItems(flow)[0].product.productId;
    const all = [...galleryProductIds(flow), splitProductId].sort((x, y) => x - y);
    expect(all).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("preserves document order of the section items", () => {
    const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
    const flow = planL5Flow(sections, products);
    const ids = sectionItemIds(flow);
    const canonicalOrder = ["a", "b", "c", "d"].filter((id) => ids.includes(id));
    expect(ids).toEqual(canonicalOrder);
  });

  it("degrades to a split with zero galleries when there is only one image", () => {
    const flow = planL5Flow(sections, [product(9)]);
    expect(splitItems(flow)).toHaveLength(1);
    expect(flow.filter((item) => item.kind === "gallery")).toHaveLength(0);
    expect(splitItems(flow)[0].product.productId).toBe(9);
  });

  it("handles a single-section body (split leads, images galleried after)", () => {
    const one = splitBodyIntoSections("## Only\n\nx").sections;
    const flow = planL5Flow(one, [product(1), product(2), product(3)]);
    const splits = splitItems(flow);
    expect(splits).toHaveLength(1);
    expect(splits[0].section.id).toBe("only");
    // No section survives as a plain item (the only one became the split).
    expect(sectionItemIds(flow)).toEqual([]);
    // The remaining two images are still placed in galleries (never lost).
    expect(galleryProductIds(flow).sort((x, y) => x - y)).toEqual([1, 2]);
  });
});

// The L5 hero image resolution (SPEC-153 patch): served hero → product photo →
// none, driving the compact-placeholder decision (no giant empty band).
describe("resolveHeroImage", () => {
  const HERO = "https://cdn.shopify.com/hero.png";
  const PHOTO = "https://cdn.shopify.com/product.jpg";

  it("paints the served art-directed hero when present and not failed", () => {
    const res = resolveHeroImage(HERO, false, PHOTO);
    expect(res.backgroundImage).toBe(HERO);
    expect(res.showHero).toBe(true);
    expect(res.hasImage).toBe(true);
  });

  it("falls back to the product photo (width-sized) when the hero failed", () => {
    const res = resolveHeroImage(HERO, true, PHOTO);
    expect(res.showHero).toBe(false);
    expect(res.hasImage).toBe(true);
    expect(res.backgroundImage).toContain("width=2000");
  });

  it("uses the product photo when there is no hero URL", () => {
    const res = resolveHeroImage(null, false, PHOTO);
    expect(res.showHero).toBe(false);
    expect(res.hasImage).toBe(true);
    expect(res.backgroundImage).toContain("width=2000");
  });

  it("resolves to no image (compact placeholder) with no hero and no photo", () => {
    const res = resolveHeroImage(null, false, null);
    expect(res.backgroundImage).toBeNull();
    expect(res.showHero).toBe(false);
    expect(res.hasImage).toBe(false);
  });

  it("resolves to no image when a failed hero has no photo to fall back to", () => {
    const res = resolveHeroImage(HERO, true, null);
    expect(res.backgroundImage).toBeNull();
    expect(res.hasImage).toBe(false);
  });
});

// The harness progress timeline accumulator (SPEC-151) — shared by the new-blog
// generation surface and the refine loop so both reveal PROGRESS (not the
// discarded live drafts) as a staged animation.
describe("appendProgressPhase", () => {
  it("appends a new phrase to the timeline", () => {
    expect(appendProgressPhase(["Researching…"], "Writing…")).toEqual([
      "Researching…",
      "Writing…",
    ]);
  });

  it("appends from an empty timeline", () => {
    expect(appendProgressPhase([], "Starting…")).toEqual(["Starting…"]);
  });

  it("collapses a consecutive duplicate (returns the SAME reference)", () => {
    const phases = ["Researching…", "Writing…"];
    const next = appendProgressPhase(phases, "Writing…");
    expect(next).toBe(phases); // no new array → no needless re-render
  });

  it("keeps a non-consecutive repeat (it is a genuinely new step)", () => {
    expect(appendProgressPhase(["Writing…", "Scoring…"], "Writing…")).toEqual([
      "Writing…",
      "Scoring…",
      "Writing…",
    ]);
  });
});
