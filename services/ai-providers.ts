/**
 * AI provider cards — client mutations (SPEC-238; backend SPEC-245). Every write
 * returns the full overview, which the caller writes into the
 * `integrationQueries.aiProviders()` cache. Reads go through that query; this
 * module is writes only. Keys travel one way: in.
 */
import type { AiProvidersOverview, AiTestResult, AiTextProvider } from "@/types/ai-providers";

const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "The request failed. Please try again.");
  }
  return data as T;
}

export function addAiProvider(input: {
  provider: AiTextProvider;
  apiKey: string;
  model?: string;
}): Promise<AiProvidersOverview> {
  return request("/ai-providers", "POST", {
    provider: input.provider,
    api_key: input.apiKey,
    model: input.model,
  });
}

export function updateAiProvider(
  provider: AiTextProvider,
  patch: { model?: string; is_default?: boolean; is_image_default?: boolean; is_voice_default?: boolean },
): Promise<AiProvidersOverview> {
  return request(`/ai-providers/${provider}`, "PATCH", patch);
}

export function deleteAiProvider(provider: AiTextProvider): Promise<AiProvidersOverview> {
  return request(`/ai-providers/${provider}`, "DELETE");
}

/** With `apiKey`: tests that key without storing it (the add dialog). Without: the
 * stored key, and the result is recorded on the card. */
export function testAiProvider(provider: AiTextProvider, apiKey?: string): Promise<AiTestResult> {
  return request(`/ai-providers/${provider}/test`, "POST", apiKey ? { api_key: apiKey } : {});
}

export function setVideoKey(apiKey: string): Promise<AiProvidersOverview> {
  return request("/ai-providers/video", "PUT", { api_key: apiKey });
}

export function clearVideoKey(): Promise<AiProvidersOverview> {
  return request("/ai-providers/video", "DELETE");
}

export function testVideoKey(apiKey?: string): Promise<AiTestResult> {
  return request("/ai-providers/video/test", "POST", apiKey ? { api_key: apiKey } : {});
}
