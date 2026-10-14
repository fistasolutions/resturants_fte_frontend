import { describe, expect, it } from "vitest";

import {
  adaptBrandBrain,
  adaptBrandFact,
  adaptBrandPersona,
  type ApiBrandBrain,
} from "@/lib/adapters";

const RAW: ApiBrandBrain = {
  confirmed_at: "2026-08-11T00:00:00+00:00",
  identity: [
    {
      label: "Category",
      value:
        "Modern modest womenswear — a complete wardrobe destination, not an occasion store.",
      provenance: "owner",
      source_note: null,
      confirmed_at: "2026-08-11T00:00:00+00:00",
    },
  ],
  voice: {
    tone: {
      label: "Tone",
      value: "Warm, polished, confident.",
      provenance: "owner",
      source_note: null,
      confirmed_at: "2026-08-11T00:00:00+00:00",
    },
    avoid: {
      label: "Never",
      value: "Cheeky is NOT the default; never lowest-price.",
      provenance: "owner",
      source_note: null,
      confirmed_at: "2026-08-11T00:00:00+00:00",
    },
  },
  personas: [
    {
      name: "The Modern Modest Woman",
      role: "Modesty as a given, style without compromise",
      description: "She takes modesty as a given and still wants current clothing.",
      tags: ["modest", "current"],
      provenance: "owner",
    },
  ],
  guardrails: [
    {
      label: "Not occasion wear",
      value: "Don't call the brand an occasion or event-wear store.",
      provenance: "owner",
      source_note: null,
      confirmed_at: "2026-08-11T00:00:00+00:00",
    },
  ],
  proof_points: [
    {
      label: "Customer rating",
      value: "4.72★ from 3,981 verified reviews.",
      provenance: "owner",
      source_note: "examplestore.com",
      confirmed_at: "2026-08-11T00:00:00+00:00",
    },
    {
      label: "Average order value",
      value: "$120.00",
      provenance: "measured",
      source_note: "Trailing 90 days",
      confirmed_at: null,
    },
    {
      label: "Best-selling category",
      value: "Dresses",
      provenance: "research",
      source_note: null,
      confirmed_at: null,
    },
  ],
};

describe("adaptBrandBrain", () => {
  it("maps the backend payload onto BrandBrainData", () => {
    const data = adaptBrandBrain(RAW);
    expect(data.lastConfirmed).toBe("2026-08-11T00:00:00+00:00");
    expect(data.identity).toHaveLength(1);
    expect(data.guardrails).toHaveLength(1);
    expect(data.proofPoints).toHaveLength(3);
  });

  it("maps backend provenance to UI provenance chips", () => {
    const data = adaptBrandBrain(RAW);
    // owner → onboarding (the core mapping)
    expect(data.identity[0].source).toBe("onboarding");
    expect(data.voice.tone?.source).toBe("onboarding");
    expect(data.personas[0].source).toBe("onboarding");
    // measured / research pass through by name
    const byLabel = Object.fromEntries(data.proofPoints.map((f) => [f.label, f]));
    expect(byLabel["Average order value"].source).toBe("measured");
    expect(byLabel["Best-selling category"].source).toBe("research");
  });

  it("preserves provenance detail and confirmation timestamps", () => {
    const data = adaptBrandBrain(RAW);
    const aov = data.proofPoints.find((f) => f.label === "Average order value");
    expect(aov?.sourceNote).toBe("Trailing 90 days");
    expect(aov?.confirmedAt).toBeNull();
    expect(data.identity[0].confirmedAt).toBe("2026-08-11T00:00:00+00:00");
  });

  it("adapts personas: role→tagline, tags→traits, slug id, no invented share", () => {
    const data = adaptBrandBrain(RAW);
    const persona = data.personas[0];
    expect(persona.id).toBe("the-modern-modest-woman");
    expect(persona.tagline).toBe("Modesty as a given, style without compromise");
    expect(persona.traits).toEqual(["modest", "current"]);
    expect(persona.share).toBeUndefined();
  });

  it("tolerates a null voice tone/avoid without throwing", () => {
    const data = adaptBrandBrain({ ...RAW, voice: { tone: null, avoid: null } });
    expect(data.voice.tone).toBeNull();
    expect(data.voice.avoid).toBeNull();
  });
});

describe("adaptBrandFact (SPEC-111 CRUD shapes)", () => {
  it("maps the row id + section for a stored manual fact", () => {
    const fact = adaptBrandFact({
      id: 42,
      section: "identity",
      label: "New pillar",
      value: "A new value",
      provenance: "manual",
      source_note: "Added in-app",
      confirmed_at: "2026-08-12T00:00:00+00:00",
    });
    expect(fact.id).toBe(42);
    expect(fact.section).toBe("identity");
    expect(fact.source).toBe("manual");
  });

  it("keeps id null and section undefined for a measured/id-less fact", () => {
    const fact = adaptBrandFact({
      id: null,
      label: "Average order value",
      value: "$120.00",
      provenance: "measured",
      source_note: "Trailing 90 days",
      confirmed_at: null,
    });
    expect(fact.id).toBeNull();
    expect(fact.section).toBeUndefined();
  });

  it("drops an unrecognized section rather than passing it through", () => {
    const fact = adaptBrandFact({
      id: 1,
      section: "totally-new-section",
      label: "L",
      value: "V",
      provenance: "owner",
      source_note: null,
      confirmed_at: null,
    });
    expect(fact.section).toBeUndefined();
  });
});

describe("adaptBrandPersona (SPEC-111 CRUD shapes)", () => {
  it("carries the backend row id as dbId while keeping the slug id", () => {
    const persona = adaptBrandPersona({
      id: 7,
      name: "The Gift Buyer",
      role: "Shops for others",
      description: "Buys presents.",
      tags: ["gifting"],
      provenance: "manual",
    });
    expect(persona.id).toBe("the-gift-buyer");
    expect(persona.dbId).toBe(7);
    expect(persona.source).toBe("manual");
    expect(persona.traits).toEqual(["gifting"]);
  });

  it("defaults dbId to null when the backend omits an id", () => {
    const persona = adaptBrandPersona({
      name: "Legacy",
      role: "r",
      description: "d",
      tags: [],
      provenance: "owner",
    });
    expect(persona.dbId).toBeNull();
  });
});
