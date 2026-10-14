import { describe, expect, it } from "vitest";

import {
  adaptBrandBrain,
  adaptIntentTemplate,
  type ApiBrandBrain,
  type ApiIntentTemplate,
} from "@/lib/adapters";
import {
  INTENT_TEMPLATE_INTENTS,
  intentTemplateHasPlaceholder,
} from "@/lib/spotlight";

describe("intentTemplateHasPlaceholder", () => {
  it("requires the {category} placeholder", () => {
    expect(intentTemplateHasPlaceholder("modest {category} for work")).toBe(true);
    expect(intentTemplateHasPlaceholder("modest skirts for work")).toBe(false);
    expect(intentTemplateHasPlaceholder("")).toBe(false);
  });
});

describe("INTENT_TEMPLATE_INTENTS", () => {
  it("lists the four backend intents in order", () => {
    expect([...INTENT_TEMPLATE_INTENTS]).toEqual([
      "high",
      "seasonal",
      "informational",
      "comparison",
    ]);
  });
});

describe("adaptIntentTemplate", () => {
  it("maps a template row", () => {
    const raw: ApiIntentTemplate = {
      id: 3,
      template: "modest {category} for work",
      intent: "high",
      persona: "The Full-Wardrobe Shopper",
      provenance: "default",
      sort: 2,
    };
    expect(adaptIntentTemplate(raw)).toEqual({
      id: 3,
      template: "modest {category} for work",
      intent: "high",
      persona: "The Full-Wardrobe Shopper",
      provenance: "default",
      sort: 2,
    });
  });
});

describe("adaptBrandBrain — intent templates", () => {
  const base: ApiBrandBrain = {
    confirmed_at: "2026-08-22T00:00:00Z",
    identity: [],
    voice: { tone: null, avoid: null },
    personas: [],
    guardrails: [],
    proof_points: [],
  };

  it("maps intent_templates when present", () => {
    const out = adaptBrandBrain({
      ...base,
      intent_templates: [
        { id: 1, template: "modest {category} for work", intent: "high",
          persona: "P", provenance: "default", sort: 0 },
      ],
    });
    expect(out.intentTemplates).toHaveLength(1);
    expect(out.intentTemplates[0].template).toBe("modest {category} for work");
  });

  it("defaults to an empty array when absent", () => {
    expect(adaptBrandBrain(base).intentTemplates).toEqual([]);
  });
});
