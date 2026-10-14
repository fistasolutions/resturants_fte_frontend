/**
 * Pure helpers for the AI provider cards and the chat model picker (SPEC-238).
 * Labels come from the model catalog in `lib/ai-models.ts`; everything here is
 * derived from the backend overview and is unit-tested in node.
 */
import {
  AI_MODEL_BY_ID,
  AI_MODELS,
  PROVIDER_LABEL,
  TIER_LABEL,
  optionFor,
  type ModelProvider,
  type ModelTier,
} from "@/lib/ai-models";

/** Position in the curated catalog; unknown ids sort last, in backend order. */
function catalogRank(id: string): number {
  const index = AI_MODELS.findIndex((option) => option.id === id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
import type {
  AiProviderCard,
  AiProvidersOverview,
  AiTextProvider,
  ChatModels,
} from "@/types/ai-providers";

export const TEXT_PROVIDERS: readonly AiTextProvider[] = ["openai", "anthropic", "gemini"];

/** Human name for a provider id. */
export function providerLabel(provider: AiTextProvider): string {
  return PROVIDER_LABEL[provider as ModelProvider] ?? provider;
}

/** Human name for a model id (with or without the provider prefix). */
export function modelLabel(modelId: string): string {
  const match =
    (modelId.includes("/") ? AI_MODEL_BY_ID[modelId] : undefined) ??
    AI_MODELS.find((option) => option.id.endsWith(`/${modelId}`));
  if (match) return match.label;
  return modelId.includes("/") ? modelId.slice(modelId.indexOf("/") + 1) : modelId;
}

export interface ModelOption {
  /** Model name without the provider prefix — what the card stores. */
  value: string;
  label: string;
}

/** The dropdown for one provider's card: the backend catalog, labelled. */
export function modelOptionsFor(
  provider: AiTextProvider,
  catalog: AiProvidersOverview["catalog"],
): ModelOption[] {
  return (catalog[provider] ?? []).map((value) => ({
    value,
    label: modelLabel(`${provider}/${value}`),
  }));
}

/** Which of the three providers the "Add provider" dropdown may still offer —
 * all of them (re-adding replaces the key), but flagged when already added. */
export function addableProviders(
  cards: AiProviderCard[],
): Array<{ value: AiTextProvider; label: string; replaces: boolean }> {
  const present = new Set(cards.filter((card) => card.source === "database").map((c) => c.provider));
  return TEXT_PROVIDERS.map((value) => ({
    value,
    label: providerLabel(value),
    replaces: present.has(value),
  }));
}

/** The image-default select: only image-capable cards that are actually added. */
export function imageDefaultOptions(cards: AiProviderCard[]): Array<{ value: AiTextProvider; label: string }> {
  return cards
    .filter((card) => card.image_capable && card.source === "database")
    .map((card) => ({ value: card.provider, label: providerLabel(card.provider) }));
}

/** SPEC-269: the cards that can speak — OpenAI and Gemini; never Anthropic. */
export function voiceDefaultOptions(cards: AiProviderCard[]): Array<{ value: AiTextProvider; label: string }> {
  return cards
    .filter((card) => card.voice_capable && card.source === "database")
    .map((card) => ({ value: card.provider, label: providerLabel(card.provider) }));
}

/** True when nothing added is the default — the system is on the `.env` key. */
export function usingEnvDefault(overview: AiProvidersOverview): boolean {
  return overview.default_source === "env";
}

export type CardStatus =
  | { tone: "ok"; label: string }
  | { tone: "warn"; label: string }
  | { tone: "muted"; label: string };

/** The status pill for a card. */
export function cardStatus(card: AiProviderCard): CardStatus {
  if (card.source === "env") return { tone: "muted", label: "From .env" };
  if (card.last_test_ok === true) return { tone: "ok", label: "Connected · tested" };
  if (card.last_test_ok === false) return { tone: "warn", label: "Test failed" };
  return { tone: "muted", label: "Saved · not tested" };
}

export interface PickerOption {
  id: string;
  label: string;
  tier: ModelTier;
  tierLabel: string;
  /** One line from the catalog: what it is for and how it costs. */
  blurb: string;
  /** False until the provider has a key — shown locked, never selectable. */
  available: boolean;
}

export interface PickerGroup {
  provider: AiTextProvider;
  label: string;
  /** True when at least one model of the provider can be chosen. */
  available: boolean;
  options: PickerOption[];
}

/** The chat picker's groups (SPEC-238 Patch): every provider, available ones
 * first; within a provider the curated catalog order (best first), not the
 * backend's alphabetical one; each model with its tier and one-line description. */
export function chatPickerGroups(models: ChatModels): PickerGroup[] {
  const groups = TEXT_PROVIDERS.map((provider) => {
    const options = models.options
      .filter((option) => option.provider === provider)
      .sort((a, b) => catalogRank(a.id) - catalogRank(b.id))
      .map((option) => {
        const catalog = optionFor(option.id);
        return {
          id: option.id,
          label: catalog.label,
          tier: catalog.tier,
          tierLabel: TIER_LABEL[catalog.tier],
          blurb: catalog.blurb,
          available: option.available,
        };
      });
    return {
      provider,
      label: providerLabel(provider),
      available: options.some((option) => option.available),
      options,
    };
  }).filter((group) => group.options.length > 0);
  return [...groups.filter((g) => g.available), ...groups.filter((g) => !g.available)];
}

export function providerOfModel(modelId: string): AiTextProvider | null {
  const provider = modelId.split("/")[0];
  return (TEXT_PROVIDERS as readonly string[]).includes(provider) ? (provider as AiTextProvider) : null;
}

/** The temperature ceiling for a model id, from the backend's table. */
export function temperatureMaxFor(modelId: string, max: Record<AiTextProvider, number>): number {
  const provider = providerOfModel(modelId);
  return provider ? max[provider] : 1;
}

/** Clamp a temperature into the provider's range, one decimal. */
export function clampTemperature(value: number, ceiling: number): number {
  const clamped = Math.min(Math.max(value, 0), ceiling);
  return Math.round(clamped * 10) / 10;
}

/** The small tag under a reply: "Gemini 2.5 Flash · t 0.3". */
export function modelTag(modelId: string | null | undefined, temperature: number | null | undefined): string | null {
  if (!modelId) return null;
  const label = modelLabel(modelId);
  return temperature === null || temperature === undefined ? label : `${label} · t ${temperature}`;
}

/** The picker's list after the owner types (SPEC-238 Patches): a token search over
 * the model name, its provider and its blurb; an empty query keeps every group. */
export function filterPickerGroups(groups: PickerGroup[], query: string): PickerGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  const tokens = q.split(/\s+/);
  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((o) => {
        const hay = `${o.label} ${group.label} ${o.tierLabel} ${o.blurb}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      }),
    }))
    .filter((group) => group.options.length > 0);
}

/** The chosen model, lifted out of its group so it is always the first row. */
export function pinnedPickerOption(groups: PickerGroup[], selectedId: string | null | undefined): { option: PickerOption; provider: string } | null {
  if (!selectedId) return null;
  for (const group of groups) {
    const option = group.options.find((o) => o.id === selectedId);
    if (option) return { option, provider: group.label };
  }
  return null;
}

/** What an unavailable model says, and where to fix it. */
export const UNAVAILABLE_LABEL = "Unavailable — no key on Integrations";
