import { describe, expect, it } from "vitest";

import {
  adaptBlogDraft,
  adaptPublishedPost,
  adaptSpotlightQuery,
  type ApiBlogDraft,
  type ApiPublishedPost,
  type ApiSpotlightQuery,
} from "@/lib/adapters";
import {
  draftReadMinutes,
  draftStatusLabel,
  queryIntentLabel,
  seoToneLabel,
  shopifyImageUrl,
} from "@/lib/spotlight";

// Pure, node-safe: the adapters/helpers never import the server-only service
// (mirrors tests/brand-brain-adapter.test.ts).

describe("adaptSpotlightQuery", () => {
  const RAW: ApiSpotlightQuery = {
    id: 7,
    keyword: "modest dresses outfits",
    monthly_volume: null,
    persona: "The Modern Modest Woman",
    intent: "high",
    source: "derived",
    cluster: "dresses",
  };

  it("maps snake_case to camelCase and keeps a null volume null", () => {
    expect(adaptSpotlightQuery(RAW)).toEqual({
      id: 7,
      keyword: "modest dresses outfits",
      monthlyVolume: null,
      persona: "The Modern Modest Woman",
      intent: "high",
      source: "derived",
      cluster: "dresses",
      // SPEC-163: absent on the payload, so it adapts to null — derived rows
      // resolve their category by `cluster` and have no parent link.
      parentCategory: null,
    });
  });

  it("passes a real monthly volume through", () => {
    expect(adaptSpotlightQuery({ ...RAW, monthly_volume: 1900 }).monthlyVolume).toBe(
      1900,
    );
  });

  it("defaults an absent/null cluster to null (never fabricated)", () => {
    const withoutCluster: ApiSpotlightQuery = { ...RAW };
    delete withoutCluster.cluster;
    expect(adaptSpotlightQuery(withoutCluster).cluster).toBeNull();
    expect(adaptSpotlightQuery({ ...RAW, cluster: null }).cluster).toBeNull();
  });
});

describe("adaptBlogDraft", () => {
  const LIST_ROW: ApiBlogDraft = {
    id: 12,
    title: "What to Wear for Shabbos",
    handle: "what-to-wear-for-shabbos",
    meta_description: "Six fresh modest outfit ideas.",
    target_keyword: "modest shabbos outfits",
    persona: "The Full-Wardrobe Shopper",
    pov_pillar: "The complete wardrobe",
    seo_score: 94,
    word_count: 1180,
    status: "in_review",
    created_at: "2026-08-11T00:00:00+00:00",
    updated_at: "2026-08-11T00:00:00+00:00",
  };


  describe("the kept round (SPEC-121 Patch)", () => {
    it("carries is_final through so the UI can find the winning round", () => {
      const draft = adaptBlogDraft({
        ...LIST_ROW,
        critique: [
          { round: 1, is_final: true },
          { round: 2, is_final: false },
        ],
      });
      expect(draft.critique.map((r) => r.isFinal)).toEqual([true, false]);
    });

    it("defaults to false on drafts written before the marker existed", () => {
      const draft = adaptBlogDraft({
        ...LIST_ROW,
        critique: [{ round: 1 }, { round: 2 }],
      });
      expect(draft.critique.every((r) => r.isFinal === false)).toBe(true);
    });

  it("maps a list row without the heavy fields", () => {
    const draft = adaptBlogDraft(LIST_ROW);
    expect(draft.metaDescription).toBe("Six fresh modest outfit ideas.");
    expect(draft.targetKeyword).toBe("modest shabbos outfits");
    expect(draft.povPillar).toBe("The complete wardrobe");
    expect(draft.seoScore).toBe(94);
    expect(draft.status).toBe("in_review");
    expect(draft.bodyMd).toBeUndefined();
    expect(draft.grounding).toBeUndefined();
    expect(draft.agentTrace).toBeUndefined();
    // No prompt on the row → null, never faked (backend SPEC-113).
    expect(draft.prompt).toBeNull();
    // Harness scores absent on this row → null / default 1; critique & sources
    // are detail-only, so empty here (never faked; backend SPEC-121).
    expect(draft.aeoScore).toBeNull();
    expect(draft.geoScore).toBeNull();
    expect(draft.qualityScore).toBeNull();
    expect(draft.harnessRounds).toBe(1);
    expect(draft.critique).toEqual([]);
    expect(draft.sources).toEqual([]);
    // Rich-blog derivations are detail-only → empty on a list row (backend
    // SPEC-124), never fabricated.
    expect(draft.faq).toEqual([]);
    expect(draft.toc).toEqual([]);
    expect(draft.jsonLd).toEqual([]);
    // No publish state on a plain draft row → null/undefined (backend SPEC-118).
    expect(draft.liveUrl).toBeNull();
    expect(draft.publishedAt).toBeNull();
    expect(draft.live).toBeUndefined();
  });

  it("maps publish state when present (backend SPEC-118)", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      status: "published",
      live_url: "https://examplestore.com/blogs/news/what-to-wear-for-shabbos",
      published_at: "2026-08-12T09:00:00+00:00",
      live: true,
    });
    expect(draft.status).toBe("published");
    expect(draft.liveUrl).toBe(
      "https://examplestore.com/blogs/news/what-to-wear-for-shabbos",
    );
    expect(draft.publishedAt).toBe("2026-08-12T09:00:00+00:00");
    expect(draft.live).toBe(true);
  });

  it("maps the refine-loop prompt when present (backend SPEC-113)", () => {
    expect(adaptBlogDraft({ ...LIST_ROW, prompt: "Make it punchier" }).prompt).toBe(
      "Make it punchier",
    );
    expect(adaptBlogDraft({ ...LIST_ROW, prompt: null }).prompt).toBeNull();
  });

  it("maps a detail read incl. grounding (mixed casing) + trace", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      body_md: "# Title\n\nBody.",
      grounding: {
        personaId: "The Full-Wardrobe Shopper",
        povPillar: "The complete wardrobe",
        guardrails_ok: true,
        products: [
          {
            product_id: 555,
            title: "Wrap Midi Dress",
            handle: "wrap-midi-dress",
            image_url: "https://cdn.shopify.com/s/files/wrap.jpg",
            url: "https://examplestore.com/products/wrap-midi-dress",
          },
        ],
      },
      agent_trace: ["Read the shared Brand Brain", "Scored SEO 94"],
      sections: ["Intro", "Outfits"],
    });
    expect(draft.bodyMd).toBe("# Title\n\nBody.");
    expect(draft.grounding).toEqual({
      personaId: "The Full-Wardrobe Shopper",
      povPillar: "The complete wardrobe",
      guardrailsOk: true,
      products: [
        {
          productId: 555,
          title: "Wrap Midi Dress",
          handle: "wrap-midi-dress",
          imageUrl: "https://cdn.shopify.com/s/files/wrap.jpg",
          url: "https://examplestore.com/products/wrap-midi-dress",
        },
      ],
    });
    expect(draft.agentTrace).toEqual([
      "Read the shared Brand Brain",
      "Scored SEO 94",
    ]);
    expect(draft.sections).toEqual(["Intro", "Outfits"]);
  });

  it("defaults missing grounding fields safely (never faked)", () => {
    const draft = adaptBlogDraft({ ...LIST_ROW, grounding: {} });
    expect(draft.grounding).toEqual({
      personaId: null,
      povPillar: "",
      guardrailsOk: false,
      products: [],
    });
  });

  it("nulls absent product handle/image/url rather than faking them", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      grounding: { products: [{ product_id: 9, title: "Bare Product" }] },
    });
    expect(draft.grounding?.products).toEqual([
      { productId: 9, title: "Bare Product", handle: null, imageUrl: null, url: null },
    ]);
  });

  it("maps the quality-harness scores + rounds when present (backend SPEC-121)", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      aeo_score: 79,
      geo_score: 74,
      quality_score: 88,
      harness_rounds: 3,
    });
    expect(draft.aeoScore).toBe(79);
    expect(draft.geoScore).toBe(74);
    expect(draft.qualityScore).toBe(88);
    expect(draft.harnessRounds).toBe(3);
  });

  it("keeps an explicit null harness score null (never coerced to 0)", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      aeo_score: null,
      geo_score: null,
      quality_score: null,
    });
    expect(draft.aeoScore).toBeNull();
    expect(draft.geoScore).toBeNull();
    expect(draft.qualityScore).toBeNull();
  });

  it("maps the per-round critique + researched sources on a detail read", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      critique: [
        {
          round: 1,
          scores: { seo: 88, aeo: 70, geo: 66, quality: 84 },
          min: 66,
          overall: 78,
          notes: {
            seo: "Strong keyword coverage.",
            aeo: "Add a direct-answer intro.",
            geo: "Cite more live sources.",
            quality: "On brand and warm.",
          },
          feedback: "Add a Q&A block and one more citation.",
        },
        {
          round: 2,
          scores: { seo: 90, aeo: 82, geo: 76, quality: 88 },
          min: 76,
          overall: 84,
          notes: {
            seo: "Kept strong.",
            aeo: "Answer block added.",
            geo: "Two sources now cited.",
            quality: "Consistent voice.",
          },
          feedback: "Ship it.",
        },
      ],
      sources: [
        "https://www.example.com/modest-fashion-trends",
        "https://vogue.com/article",
      ],
    });
    expect(draft.critique).toHaveLength(2);
    expect(draft.critique[1]).toEqual({
      round: 2,
      scores: { seo: 90, aeo: 82, geo: 76, quality: 88 },
      min: 76,
      overall: 84,
      notes: {
        seo: "Kept strong.",
        aeo: "Answer block added.",
        geo: "Two sources now cited.",
        quality: "Consistent voice.",
      },
      feedback: "Ship it.",
      // SPEC-121 Patch: absent on this payload, so it adapts to false — the
      // disclosure then falls back to the last round, as it did before.
      isFinal: false,
    });
    // Sources: bare URL strings → { url } objects, blanks dropped.
    expect(draft.sources).toEqual([
      { url: "https://www.example.com/modest-fashion-trends" },
      { url: "https://vogue.com/article" },
    ]);
  });

  it("maps the rich-blog faq/toc/json_ld on a detail read (backend SPEC-124)", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      faq: [
        { q: "How do I style it?", a: "Layer under a blazer." },
        { q: "True to size?", a: "Runs true to size." },
      ],
      toc: [
        { id: "why-one-wardrobe", text: "Why one wardrobe" },
        { id: "frequently-asked-questions", text: "Frequently Asked Questions" },
      ],
      json_ld: [
        { "@context": "https://schema.org", "@type": "Article", headline: "x" },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] },
      ],
    });
    expect(draft.faq).toEqual([
      { q: "How do I style it?", a: "Layer under a blazer." },
      { q: "True to size?", a: "Runs true to size." },
    ]);
    expect(draft.toc).toEqual([
      { id: "why-one-wardrobe", text: "Why one wardrobe" },
      { id: "frequently-asked-questions", text: "Frequently Asked Questions" },
    ]);
    expect(draft.jsonLd).toHaveLength(2);
    expect(draft.jsonLd[0]["@type"]).toBe("Article");
    expect(draft.jsonLd[1]["@type"]).toBe("FAQPage");
  });

  it("drops incomplete faq/toc entries rather than faking them", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      faq: [
        { q: "Real?", a: "Yes." },
        { q: "", a: "orphan answer" },
        { q: "orphan question", a: "" },
      ],
      toc: [
        { id: "a", text: "A" },
        { id: "", text: "no id" },
      ],
    });
    expect(draft.faq).toEqual([{ q: "Real?", a: "Yes." }]);
    expect(draft.toc).toEqual([{ id: "a", text: "A" }]);
  });

  it("fills sparse critique/source payloads with safe defaults", () => {
    const draft = adaptBlogDraft({
      ...LIST_ROW,
      critique: [{ round: 1 }],
      sources: ["https://a.com", "", { url: "https://b.com" }, { url: null }],
    });
    expect(draft.critique[0]).toEqual({
      round: 1,
      scores: { seo: 0, aeo: 0, geo: 0, quality: 0 },
      min: 0,
      overall: 0,
      notes: { seo: "", aeo: "", geo: "", quality: "" },
      feedback: "",
      isFinal: false,
    });
    // Empty string and urlless object are dropped; string + { url } survive.
    expect(draft.sources).toEqual([{ url: "https://a.com" }, { url: "https://b.com" }]);
  });

  it("keeps the publish statuses and coerces only truly-unknown ones", () => {
    // Publish states are real statuses since backend SPEC-118 — kept, not coerced.
    expect(adaptBlogDraft({ ...LIST_ROW, status: "published" }).status).toBe(
      "published",
    );
    expect(adaptBlogDraft({ ...LIST_ROW, status: "unpublished" }).status).toBe(
      "unpublished",
    );
    expect(adaptBlogDraft({ ...LIST_ROW, status: "draft" }).status).toBe("draft");
    expect(adaptBlogDraft({ ...LIST_ROW, status: "approved" }).status).toBe(
      "approved",
    );
    // A value outside the whole vocabulary still falls back to in_review.
    expect(adaptBlogDraft({ ...LIST_ROW, status: "banana" }).status).toBe(
      "in_review",
    );
  });
});

describe("adaptPublishedPost", () => {
  const RAW: ApiPublishedPost = {
    id: 21,
    title: "What to Wear for Shabbos",
    handle: "what-to-wear-for-shabbos",
    status: "published",
    target_keyword: "modest shabbos outfits",
    live_url: "https://examplestore.com/blogs/news/what-to-wear-for-shabbos",
    published_at: "2026-08-12T09:00:00+00:00",
    live: true,
  };

  it("maps the real backend payload (no seo/persona/image in it today)", () => {
    expect(adaptPublishedPost(RAW)).toEqual({
      id: 21,
      title: "What to Wear for Shabbos",
      handle: "what-to-wear-for-shabbos",
      status: "published",
      targetKeyword: "modest shabbos outfits",
      liveUrl: "https://examplestore.com/blogs/news/what-to-wear-for-shabbos",
      publishedAt: "2026-08-12T09:00:00+00:00",
      unpublishedAt: null,
      unpublishedReason: null,
      live: true,
      // Enrichment absent from the current payload → null, never fabricated.
      seoScore: null,
      persona: null,
      imageUrl: null,
      // SPEC-126 attribution absent → 0/0, never fabricated.
      attributedOrders: 0,
      attributedRevenue: 0,
      // SPEC-197 journey attribution, same rule: absent means 0, not unknown.
      firstTouchOrders: 0,
      firstTouchRevenue: 0,
      lastTouchOrders: 0,
      lastTouchRevenue: 0,
    });
  });

  it("defaults a missing `live` flag to true (a listed row is live)", () => {
    const withoutLive: ApiPublishedPost = { ...RAW };
    delete withoutLive.live;
    expect(adaptPublishedPost(withoutLive).live).toBe(true);
  });

  it("maps SPEC-126 blog → sales attribution when present", () => {
    const withAttribution = adaptPublishedPost({
      ...RAW,
      attributed_orders: 4,
      attributed_revenue: 512.5,
    });
    expect(withAttribution.attributedOrders).toBe(4);
    expect(withAttribution.attributedRevenue).toBe(512.5);
  });

  it("maps optional enrichment through if a later backend adds it", () => {
    const enriched = adaptPublishedPost({
      ...RAW,
      seo_score: 94,
      persona: "The Full-Wardrobe Shopper",
      image_url: "https://cdn.shopify.com/s/files/wrap.jpg",
      live: false,
    });
    expect(enriched.seoScore).toBe(94);
    expect(enriched.persona).toBe("The Full-Wardrobe Shopper");
    expect(enriched.imageUrl).toBe("https://cdn.shopify.com/s/files/wrap.jpg");
    expect(enriched.live).toBe(false);
  });
});

describe("spotlight display helpers", () => {
  it("labels known intents and title-cases the rest", () => {
    expect(queryIntentLabel("high")).toBe("High intent");
    expect(queryIntentLabel("seasonal")).toBe("Seasonal");
    expect(queryIntentLabel("informational")).toBe("Informational");
    expect(queryIntentLabel("brand_new")).toBe("Brand new");
    expect(queryIntentLabel("")).toBe("—");
  });

  it("floors read time at 1 minute", () => {
    expect(draftReadMinutes(0)).toBe(1);
    expect(draftReadMinutes(50)).toBe(1);
    expect(draftReadMinutes(1180)).toBe(6);
  });

  it("labels draft statuses in review vocabulary", () => {
    expect(draftStatusLabel("in_review")).toBe("In review");
    expect(draftStatusLabel("approved")).toBe("Approved");
    expect(draftStatusLabel("changes_requested")).toBe("Changes requested");
  });

  it("labels the SEO tone bucket", () => {
    expect(seoToneLabel(94)).toBe("Strong");
    expect(seoToneLabel(65)).toBe("Fair");
    expect(seoToneLabel(30)).toBe("Needs work");
  });

  it("sizes a Shopify CDN image via the width param and passes junk through", () => {
    expect(shopifyImageUrl("https://cdn.shopify.com/s/files/wrap.jpg", 800)).toBe(
      "https://cdn.shopify.com/s/files/wrap.jpg?width=800",
    );
    // Overwrites an existing width rather than appending a second one.
    expect(shopifyImageUrl("https://cdn.shopify.com/s/f.jpg?width=100", 800)).toBe(
      "https://cdn.shopify.com/s/f.jpg?width=800",
    );
    expect(shopifyImageUrl("not-a-url", 800)).toBe("not-a-url");
  });
  });
});
