/** AI provider cards (backend SPEC-245) — `GET /ai-providers`. Keys never appear
 * here: the backend reports status only. */

export type AiTextProvider = "openai" | "anthropic" | "gemini";
export type AiCardSource = "database" | "env";

export interface AiProviderCard {
  provider: AiTextProvider;
  /** The provider's chosen model, without the provider prefix. */
  model: string;
  is_default: boolean;
  is_image_default: boolean;
  image_capable: boolean;
  /** SPEC-269: this card's speech models answer Talk to Glisp. */
  is_voice_default: boolean;
  voice_capable: boolean;
  source: AiCardSource;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
}

export interface AiVideoCard {
  provider: "veo";
  model: string;
  configured: boolean;
  /** "database" = its own key; "gemini" = falling back to the Gemini card/env key;
   * "env" = VIDEO_API_KEY; "unset" = nothing. */
  source: "database" | "gemini" | "env" | "unset";
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
}

export interface AiProvidersOverview {
  providers: AiProviderCard[];
  video: AiVideoCard;
  image_default: AiTextProvider | null;
  image_default_source: AiCardSource;
  /** SPEC-269: which card speaks — the flag, else the first voice-capable card. */
  voice_default: AiTextProvider | null;
  voice_source: AiCardSource | "unset";
  /** "<provider>/<model>" in force for every agent, or null when nothing is set. */
  default: string | null;
  default_source: AiCardSource;
  env: {
    text_model: string | null;
    image_provider: string | null;
    providers_with_env_key: AiTextProvider[];
  };
  catalog: Record<AiTextProvider, string[]>;
  temperature_max: Record<AiTextProvider, number>;
}

export interface AiTestResult {
  ok: boolean;
  message: string;
  latency_ms: number;
}

/** The chat model the owner chose (backend SPEC-266). Both null = system default. */
export interface ChatModelPreference {
  model: string | null;
  temperature: number | null;
}

/** `GET /chat/models` — what the chat picker may offer (backend SPEC-245). */
export interface ChatModels {
  default: string;
  /** The whole catalog; `available` is false until that provider has a key. */
  options: Array<{ id: string; provider: AiTextProvider; available: boolean }>;
  temperature_max: Record<AiTextProvider, number>;
  /** The owner's remembered choice (SPEC-266); absent on older answers. */
  preferred?: ChatModelPreference | null;
}
