/** AI model catalog for the Integrations "AI Model" card (SPEC-120). Each id is
 * a LiteLLM "<provider>/<model>" string — kept in sync with the backend
 * `AI_MODEL_IDS` whitelist (SPEC-117). The blurb + tier drive the ⓘ info modal
 * and the cost hint in the dropdown. */

export type ModelTier = "premium" | "balanced" | "economy";
export type ModelProvider = "openai" | "anthropic" | "gemini";

export interface AiModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  providerLabel: string;
  tier: ModelTier;
  /** One-line "what it's for + how it costs" shown in the info modal. */
  blurb: string;
}

export const TIER_LABEL: Record<ModelTier, string> = {
  premium: "Premium",
  balanced: "Balanced",
  economy: "Economy",
};

export const PROVIDER_LABEL: Record<ModelProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google (Gemini)",
};

/** The three providers, for the first dropdown (SPEC-120 Patch). */
export const PROVIDERS: { value: ModelProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google (Gemini)" },
];

export const AI_MODELS: AiModelOption[] = [
  {
    id: "anthropic/claude-opus-5",
    label: "Claude Opus 5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    tier: "premium",
    blurb:
      "Anthropic's most capable model — deepest reasoning and the strongest writing. Best for the executive report and nuanced analysis. Highest cost per request.",
  },
  {
    id: "anthropic/claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    tier: "balanced",
    blurb:
      "The best balance of quality, speed, and cost — the recommended default for this platform. Handles chat, briefs, and analysis well at a moderate price.",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    tier: "economy",
    blurb:
      "Fast and inexpensive. Great for high-volume, simpler tasks; lighter on nuance than Sonnet or Opus. One of the cheapest options here.",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "openai",
    providerLabel: "OpenAI",
    tier: "premium",
    blurb:
      "OpenAI's flagship — strong general reasoning and writing. A premium-priced alternative to Claude Opus if you prefer OpenAI.",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    tier: "economy",
    blurb:
      "OpenAI's small, low-cost model — fast and inexpensive for high-volume work, with less depth than full GPT-5. A budget-friendly OpenAI option.",
  },
  {
    id: "gemini/gemini-pro-latest",
    label: "Gemini Pro (latest)",
    provider: "gemini",
    providerLabel: "Google",
    tier: "premium",
    blurb:
      "Always Google's current Pro model — auto-updates, so a retirement never breaks you. Strongest Gemini writing; best for Search Visibility articles.",
  },
  {
    id: "gemini/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro (preview)",
    provider: "gemini",
    providerLabel: "Google",
    tier: "premium",
    blurb:
      "Google's recommended replacement for the retired 2.5 Pro. Deep reasoning and long-form writing at Pro cost.",
  },
  {
    id: "gemini/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "The newest Flash — fast, capable, 1M context, mid cost. A strong default for everything.",
  },
  {
    id: "gemini/gemini-3.7-flash",
    label: "Gemini 3.7 Flash",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "Previous Flash generation. Same tier and cost as 3.8; pick it if you need to pin a version.",
  },
  {
    id: "gemini/gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "Older Flash generation, kept for pinning. Prefer 3.8 unless you have a reason.",
  },
  {
    id: "gemini/gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "Older Flash generation, kept for pinning. Prefer 3.8 unless you have a reason.",
  },
  {
    id: "gemini/gemini-3-flash-preview",
    label: "Gemini 3 Flash (preview)",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "Preview build of the Flash 3 line. Fine for testing; prefer a non-preview for production.",
  },
  {
    id: "gemini/gemini-flash-latest",
    label: "Gemini Flash (latest)",
    provider: "gemini",
    providerLabel: "Google",
    tier: "balanced",
    blurb:
      "Always Google's current Flash model — auto-updates. The balanced choice that never needs changing.",
  },
  {
    id: "gemini/gemini-flash-lite-latest",
    label: "Gemini Flash Lite (latest)",
    provider: "gemini",
    providerLabel: "Google",
    tier: "economy",
    blurb:
      "Cheapest Gemini that auto-updates. Proven on this store: two 2,600-word Search Visibility articles scored 95+ on it for $0.002 each. Best for chat, commentary and anything high-volume.",
  },
  {
    id: "gemini/gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash Lite",
    provider: "gemini",
    providerLabel: "Google",
    tier: "economy",
    blurb:
      "Lite tier, pinned version. Prefer the -latest alias unless pinning.",
  },
  {
    id: "gemini/gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "gemini",
    providerLabel: "Google",
    tier: "economy",
    blurb:
      "Lite tier, pinned version. Prefer the -latest alias unless pinning.",
  },
];

export const AI_MODEL_BY_ID: Record<string, AiModelOption> = Object.fromEntries(
  AI_MODELS.map((m) => [m.id, m]),
);

/** The secret field key for a model's provider (matches backend SECRET_FIELDS["ai"]). */
export function providerKeyField(provider: ModelProvider): string {
  return `${provider}_api_key`;
}

/** Provider parsed from a "<provider>/<model>" id, defaulting to anthropic if
 * the prefix isn't one we recognise. */
export function providerOf(modelId: string): ModelProvider {
  const prefix = modelId.split("/")[0];
  return prefix === "openai" || prefix === "gemini" ? prefix : "anthropic";
}

/** The catalog option for an id, or a synthetic one for a model set in the env
 * that isn't in the catalog — so the dropdown always shows the active model
 * rather than falling back to a wrong one (SPEC-120 Patch). */
export function optionFor(modelId: string): AiModelOption {
  const known = AI_MODEL_BY_ID[modelId];
  if (known) return known;
  const provider = providerOf(modelId);
  return {
    id: modelId,
    label: modelId.split("/").slice(1).join("/") || modelId,
    provider,
    providerLabel: PROVIDER_LABEL[provider],
    tier: "balanced",
    blurb: "A model configured in the environment. Not one of the presets, but active.",
  };
}

/** Catalog models for a provider, with the active model appended if it's a
 * non-catalog env model for that same provider (so it's selectable/visible). */
export function modelsForProvider(provider: ModelProvider, activeId: string): AiModelOption[] {
  const catalog = AI_MODELS.filter((m) => m.provider === provider);
  if (providerOf(activeId) === provider && !AI_MODEL_BY_ID[activeId]) {
    return [optionFor(activeId), ...catalog];
  }
  return catalog;
}
