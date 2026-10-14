/**
 * The account's chat model (SPEC-266): the picker's choice, saved on the account
 * and read by every surface from the one `chat/models` answer. Pure.
 */
import type { ChatModelPreference, ChatModels } from "@/types/ai-providers";
import type { ChatModelOverride } from "@/types/chat";

/** The saved preference as the override the composer and `send` use. */
export function preferenceToOverride(preferred: ChatModelPreference | null | undefined): ChatModelOverride | null {
  if (!preferred) return null;
  const override: ChatModelOverride = {};
  if (preferred.model) override.model = preferred.model;
  if (preferred.temperature !== null && preferred.temperature !== undefined) {
    override.temperature = preferred.temperature;
  }
  return override.model || override.temperature !== undefined ? override : null;
}

/** The override as the body `PUT /chat/model` takes; both null clears. */
export function overrideToPreference(override: ChatModelOverride | null): ChatModelPreference {
  return {
    model: override?.model ?? null,
    temperature: override?.temperature ?? null,
  };
}

/** The models answer with a new preference in place — the optimistic cache write. */
export function withPreferred(models: ChatModels | undefined, override: ChatModelOverride | null): ChatModels | undefined {
  if (!models) return models;
  const preferred = overrideToPreference(override);
  return {
    ...models,
    preferred: preferred.model === null && preferred.temperature === null ? null : preferred,
  };
}
