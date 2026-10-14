import { describe, expect, it } from "vitest";

import { overrideToPreference, preferenceToOverride, withPreferred } from "@/lib/chat-model-preference";
import type { ChatModels } from "@/types/ai-providers";

const MODELS: ChatModels = {
  default: "gemini/gemini-pro-latest",
  options: [],
  temperature_max: { openai: 2, anthropic: 1, gemini: 2 },
  preferred: null,
};

describe("chat model preference", () => {
  it("turns the saved preference into the composer's override and back", () => {
    expect(preferenceToOverride(null)).toBeNull();
    expect(preferenceToOverride(undefined)).toBeNull();
    expect(preferenceToOverride({ model: null, temperature: null })).toBeNull();
    expect(preferenceToOverride({ model: "gemini/gemini-3.5-flash", temperature: null })).toEqual({ model: "gemini/gemini-3.5-flash" });
    expect(preferenceToOverride({ model: null, temperature: 0 })).toEqual({ temperature: 0 });
    expect(preferenceToOverride({ model: "openai/gpt-5", temperature: 0.4 })).toEqual({ model: "openai/gpt-5", temperature: 0.4 });
    expect(overrideToPreference(null)).toEqual({ model: null, temperature: null });
    expect(overrideToPreference({ model: "openai/gpt-5" })).toEqual({ model: "openai/gpt-5", temperature: null });
    expect(overrideToPreference({ temperature: 0 })).toEqual({ model: null, temperature: 0 });
  });

  it("writes the preference into the models answer, clearing on system default", () => {
    expect(withPreferred(undefined, { model: "openai/gpt-5" })).toBeUndefined();
    expect(withPreferred(MODELS, { model: "openai/gpt-5", temperature: 0.2 })?.preferred).toEqual({ model: "openai/gpt-5", temperature: 0.2 });
    expect(withPreferred({ ...MODELS, preferred: { model: "openai/gpt-5", temperature: null } }, null)?.preferred).toBeNull();
  });
});
