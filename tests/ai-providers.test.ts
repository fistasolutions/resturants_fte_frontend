import { describe, expect, it } from "vitest";

import {
  addableProviders,
  cardStatus,
  chatPickerGroups,
  clampTemperature,
  imageDefaultOptions,
  modelLabel,
  modelOptionsFor,
  modelTag,
  providerLabel,
  providerOfModel,
  temperatureMaxFor,
  usingEnvDefault,
  voiceDefaultOptions,
  filterPickerGroups,
  pinnedPickerOption,
  UNAVAILABLE_LABEL,
} from "@/lib/ai-providers";
import type { AiProviderCard, AiProvidersOverview, ChatModels } from "@/types/ai-providers";

function card(overrides: Partial<AiProviderCard>): AiProviderCard {
  return {
    provider: "openai",
    model: "gpt-5",
    is_default: false,
    is_image_default: false,
    image_capable: true,
    is_voice_default: false,
    voice_capable: true,
    source: "database",
    last_tested_at: null,
    last_test_ok: null,
    last_test_message: null,
    ...overrides,
  };
}

const CATALOG: AiProvidersOverview["catalog"] = {
  openai: ["gpt-5", "gpt-5-mini"],
  anthropic: ["claude-opus-5", "claude-sonnet-5"],
  gemini: ["gemini-3.6-flash", "gemini-flash-latest"],
};

const MAX = { openai: 2, anthropic: 1, gemini: 2 } as const;

describe("labels", () => {
  it("names providers and models from the catalog, falling back to the id", () => {
    expect(providerLabel("gemini")).toBe("Google (Gemini)");
    expect(modelLabel("anthropic/claude-sonnet-5")).toBe("Claude Sonnet 5");
    expect(modelLabel("gpt-5-mini")).toBe("GPT-5 Mini");
    expect(modelLabel("openai/gpt-99")).toBe("gpt-99");
  });

  it("builds a card's model dropdown from the backend catalog", () => {
    expect(modelOptionsFor("openai", CATALOG)).toEqual([
      { value: "gpt-5", label: "GPT-5" },
      { value: "gpt-5-mini", label: "GPT-5 Mini" },
    ]);
  });
});

describe("cards", () => {
  it("offers all three providers to add and flags the ones that would be replaced", () => {
    const cards = [card({ provider: "openai" }), card({ provider: "gemini", source: "env" })];
    expect(addableProviders(cards)).toEqual([
      { value: "openai", label: "OpenAI", replaces: true },
      { value: "anthropic", label: "Anthropic", replaces: false },
      { value: "gemini", label: "Google (Gemini)", replaces: false },
    ]);
  });

  it("image default only offers added, image-capable cards — never Anthropic", () => {
    const cards = [
      card({ provider: "openai" }),
      card({ provider: "anthropic", image_capable: false }),
      card({ provider: "gemini", source: "env" }),
    ];
    expect(imageDefaultOptions(cards)).toEqual([{ value: "openai", label: "OpenAI" }]);
  });

  it("describes a card's status", () => {
    expect(cardStatus(card({ source: "env" }))).toEqual({ tone: "muted", label: "From .env" });
    expect(cardStatus(card({ last_test_ok: true }))).toEqual({ tone: "ok", label: "Connected · tested" });
    expect(cardStatus(card({ last_test_ok: false }))).toEqual({ tone: "warn", label: "Test failed" });
    expect(cardStatus(card({}))).toEqual({ tone: "muted", label: "Saved · not tested" });
  });

  it("knows when the system is on the env fallback", () => {
    const overview = {
      providers: [], video: { provider: "veo", model: "veo", configured: false, source: "unset", last_tested_at: null, last_test_ok: null, last_test_message: null },
      image_default: null, image_default_source: "env", voice_default: null, voice_source: "unset", default: "anthropic/claude-sonnet-5", default_source: "env",
      env: { text_model: "anthropic/claude-sonnet-5", image_provider: "openai", providers_with_env_key: [] },
      catalog: CATALOG, temperature_max: MAX,
    } satisfies AiProvidersOverview;
    expect(usingEnvDefault(overview)).toBe(true);
    expect(usingEnvDefault({ ...overview, default_source: "database" })).toBe(false);
  });
});

describe("chat picker", () => {
  const models: ChatModels = {
    default: "gemini/gemini-3.6-flash",
    options: [
      { id: "gemini/gemini-3.6-flash", provider: "gemini", available: true },
      { id: "gemini/gemini-flash-latest", provider: "gemini", available: true },
      { id: "openai/gpt-5", provider: "openai", available: false },
      { id: "anthropic/claude-opus-5", provider: "anthropic", available: false },
    ],
    temperature_max: MAX,
  };

  it("orders a provider's models by the curated catalog, not alphabetically", () => {
    const groups = chatPickerGroups({
      ...models,
      options: [
        { id: "gemini/gemini-3.6-flash", provider: "gemini", available: true },
        { id: "gemini/gemini-pro-latest", provider: "gemini", available: true },
        { id: "gemini/gemini-3.8-flash", provider: "gemini", available: true },
      ],
    });
    expect(groups[0].options.map((o) => o.label)).toEqual([
      "Gemini Pro (latest)",
      "Gemini 3.8 Flash",
      "Gemini 3.6 Flash",
    ]);
  });

  it("groups by provider, available providers first, with tier and blurb from the catalog", () => {
    const groups = chatPickerGroups(models);
    expect(groups.map((g) => [g.provider, g.available])).toEqual([
      ["gemini", true],
      ["openai", false],
      ["anthropic", false],
    ]);
    // curated order: 3.6 Flash is listed before Flash (latest)
    const flash = groups[0].options.find((o) => o.id === "gemini/gemini-3.6-flash")!;
    expect(groups[0].options.map((o) => o.id)).toEqual(["gemini/gemini-3.6-flash", "gemini/gemini-flash-latest"]);
    expect(flash.label).toBe("Gemini 3.6 Flash");
    expect(flash.tierLabel).toBe("Balanced");
    expect(flash.blurb.length).toBeGreaterThan(20);
    expect(flash.available).toBe(true);
    expect(groups[2].options[0]).toMatchObject({ label: "Claude Opus 5", tierLabel: "Premium", available: false });
  });

  it("reads the provider off a model id", () => {
    expect(providerOfModel("openai/gpt-5")).toBe("openai");
    expect(providerOfModel("acme/x")).toBeNull();
  });

  it("uses the provider's temperature ceiling and clamps to it", () => {
    expect(temperatureMaxFor("anthropic/claude-opus-5", MAX)).toBe(1);
    expect(temperatureMaxFor("openai/gpt-5", MAX)).toBe(2);
    expect(clampTemperature(1.66, 1)).toBe(1);
    expect(clampTemperature(-1, 2)).toBe(0);
    expect(clampTemperature(0.34, 2)).toBe(0.3);
  });

  it("renders the reply tag", () => {
    expect(modelTag("gemini/gemini-3.6-flash", 0.3)).toBe("Gemini 3.6 Flash · t 0.3");
    expect(modelTag("openai/gpt-5", null)).toBe("GPT-5");
    expect(modelTag(null, 0.3)).toBeNull();
  });
});

describe("voiceDefaultOptions", () => {
  it("offers only the added cards that can speak", () => {
    const cards = [
      card({ provider: "openai" }),
      card({ provider: "anthropic", voice_capable: false, image_capable: false }),
      card({ provider: "gemini", source: "env" }),
    ];
    expect(voiceDefaultOptions(cards)).toEqual([{ value: "openai", label: "OpenAI" }]);
  });
});

describe("the picker's search and pinned choice (SPEC-238 Patches)", () => {
  const groups = [
    { provider: "gemini" as const, label: "Google (Gemini)", available: true, options: [
      { id: "gemini/gemini-3.8-flash", label: "Gemini 3.8 Flash", tier: "balanced" as const, tierLabel: "Balanced", blurb: "The newest Flash — fast, capable.", available: true },
      { id: "gemini/gemini-pro-latest", label: "Gemini Pro (latest)", tier: "premium" as const, tierLabel: "Premium", blurb: "Strongest Gemini writing.", available: true },
    ] },
    { provider: "anthropic" as const, label: "Anthropic (Claude)", available: false, options: [
      { id: "anthropic/claude-opus-5", label: "Claude Opus 5", tier: "premium" as const, tierLabel: "Premium", blurb: "Deepest reasoning.", available: false },
    ] },
  ];

  it("filters by name, provider, tier and blurb; empty keeps everything", () => {
    expect(filterPickerGroups(groups, "").length).toBe(2);
    expect(filterPickerGroups(groups, "flash").flatMap((g) => g.options.map((o) => o.id))).toEqual(["gemini/gemini-3.8-flash"]);
    expect(filterPickerGroups(groups, "claude").map((g) => g.provider)).toEqual(["anthropic"]);
    expect(filterPickerGroups(groups, "premium gemini").flatMap((g) => g.options.map((o) => o.label))).toEqual(["Gemini Pro (latest)"]);
    expect(filterPickerGroups(groups, "nothing here")).toEqual([]);
  });

  it("lifts the chosen model to the top with its provider", () => {
    expect(pinnedPickerOption(groups, "gemini/gemini-pro-latest")).toEqual({ option: groups[0].options[1], provider: "Google (Gemini)" });
    expect(pinnedPickerOption(groups, null)).toBeNull();
    expect(pinnedPickerOption(groups, "openai/gone")).toBeNull();
    expect(UNAVAILABLE_LABEL).toMatch(/Integrations/);
  });
});
