import { describe, expect, it } from "vitest";

import {
  AI_MODEL_BY_ID,
  AI_MODELS,
  modelsForProvider,
  optionFor,
  providerKeyField,
  providerOf,
  TIER_LABEL,
} from "@/lib/ai-models";

describe("AI model catalog (SPEC-120)", () => {
  it("every id is '<provider>/<model>' and provider matches the prefix", () => {
    for (const m of AI_MODELS) {
      const [prefix, name] = m.id.split("/");
      expect(name, m.id).toBeTruthy();
      expect(prefix).toBe(m.provider);
      expect(Object.keys(TIER_LABEL)).toContain(m.tier);
      expect(m.blurb.length).toBeGreaterThan(20);
    }
  });

  it("ids are unique and fully indexed", () => {
    const ids = AI_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(AI_MODEL_BY_ID)).toHaveLength(ids.length);
  });

  it("providerKeyField matches the backend SECRET_FIELDS['ai'] naming", () => {
    expect(providerKeyField("anthropic")).toBe("anthropic_api_key");
    expect(providerKeyField("openai")).toBe("openai_api_key");
    expect(providerKeyField("gemini")).toBe("gemini_api_key");
  });

  it("includes the cheap OpenAI model the env uses (gpt-5-mini)", () => {
    expect(AI_MODEL_BY_ID["openai/gpt-5-mini"]).toBeDefined();
    expect(AI_MODEL_BY_ID["openai/gpt-5-mini"].tier).toBe("economy");
  });

  it("providerOf parses the id prefix and defaults safely", () => {
    expect(providerOf("openai/gpt-5-mini")).toBe("openai");
    expect(providerOf("gemini/gemini-2.5-flash")).toBe("gemini");
    expect(providerOf("weird-string")).toBe("anthropic");
  });

  it("optionFor synthesises a visible option for a non-catalog env model", () => {
    const opt = optionFor("openai/some-future-model");
    expect(opt.provider).toBe("openai");
    expect(opt.label).toBe("some-future-model");
    // and it becomes selectable in that provider's model list
    const ids = modelsForProvider("openai", "openai/some-future-model").map((m) => m.id);
    expect(ids).toContain("openai/some-future-model");
  });
});
