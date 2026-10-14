/**
 * Spotlight client mutations (backend SPEC-109). These run in "use client"
 * code, so — like every other client mutation in the app (winback sync,
 * brief decisions, iPacky import) — they go through `/api/proxy`, which injects
 * the httpOnly token server-side. Kept out of `services/spotlight.ts` because
 * that module is server-only (imports `serverApi`); this one is client-safe
 * (types + the pure adapter only).
 */
import {
  adaptBlogDraft,
  adaptBrandBrain,
  adaptBrandFact,
  adaptBrandPersona,
  adaptDailyPicksSnapshot,
  adaptIntentTemplate,
  type ApiBlogDraft,
  type ApiBrandBrain,
  type ApiBrandBrainFact,
  type ApiBrandPersona,
  type ApiDailyPicksSnapshot,
  type ApiIntentTemplate,
} from "@/lib/adapters";
import type {
  BlogDraft,
  BrandBrainData,
  DailyPicksSnapshot,
  Fact,
  FactSection,
  IntentTemplate,
  Persona,
} from "@/types/spotlight";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** Shared proxy request helper for Brand Brain CRUD (SPEC-111). Throws the
 * backend's error message on a non-OK response; returns the parsed JSON body. */
async function apiRequest<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error?.message ?? `Request failed (${res.status}).`);
  }
  return payload as T;
}

/* ── Daily Picks (SPEC-155) ──────────────────────────────────────────────── */

/** Force a rebuild of today's Daily Picks (source=manual): re-score the clusters
 * and re-run the research agent. Multi-second — the caller shows a busy state.
 * Returns the freshly-persisted snapshot. */
export async function refreshDailyPicks(): Promise<DailyPicksSnapshot> {
  const { picks } = await apiRequest<{ picks: ApiDailyPicksSnapshot }>(
    "/spotlight/daily-picks/refresh",
    "POST",
  );
  return adaptDailyPicksSnapshot(picks);
}

/* ── Brand Brain CRUD (SPEC-111) ─────────────────────────────────────────── */

/** Create a manual fact in an editable section (identity | voice | guardrail). */
export async function createFact(input: {
  section: FactSection;
  label: string;
  value: string;
}): Promise<Fact> {
  const raw = await apiRequest<ApiBrandBrainFact>("/brand-brain/facts", "POST", {
    section: input.section,
    label: input.label,
    value: input.value,
  });
  return adaptBrandFact(raw);
}

/** Edit a fact's label/value. Editing an owner fact flips its provenance to
 * manual on the backend; the returned fact reflects that. */
export async function updateFact(
  id: number,
  patch: { label?: string; value?: string },
): Promise<Fact> {
  const raw = await apiRequest<ApiBrandBrainFact>(
    `/brand-brain/facts/${id}`,
    "PATCH",
    patch,
  );
  return adaptBrandFact(raw);
}

export async function deleteFact(id: number): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/brand-brain/facts/${id}`, "DELETE");
}

export async function createPersona(input: {
  name: string;
  role: string;
  description: string;
  tags: string[];
}): Promise<Persona> {
  const raw = await apiRequest<ApiBrandPersona>(
    "/brand-brain/personas",
    "POST",
    input,
  );
  return adaptBrandPersona(raw);
}

export async function updatePersona(
  id: number,
  patch: { name?: string; role?: string; description?: string; tags?: string[] },
): Promise<Persona> {
  const raw = await apiRequest<ApiBrandPersona>(
    `/brand-brain/personas/${id}`,
    "PATCH",
    patch,
  );
  return adaptBrandPersona(raw);
}

export async function deletePersona(id: number): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/brand-brain/personas/${id}`, "DELETE");
}

/* ── Search intent templates (SPEC-156) ──────────────────────────────────── */

export async function createIntentTemplate(input: {
  template: string;
  intent: string;
  persona: string;
}): Promise<IntentTemplate> {
  const raw = await apiRequest<ApiIntentTemplate>(
    "/brand-brain/intent-templates",
    "POST",
    input,
  );
  return adaptIntentTemplate(raw);
}

export async function updateIntentTemplate(
  id: number,
  patch: { template?: string; intent?: string; persona?: string },
): Promise<IntentTemplate> {
  const raw = await apiRequest<ApiIntentTemplate>(
    `/brand-brain/intent-templates/${id}`,
    "PATCH",
    patch,
  );
  return adaptIntentTemplate(raw);
}

export async function deleteIntentTemplate(id: number): Promise<void> {
  await apiRequest<{ ok: boolean }>(
    `/brand-brain/intent-templates/${id}`,
    "DELETE",
  );
}

/** Restamp `confirmed_at` on all owner/manual facts; returns the full brain. */
export async function confirmBrandBrain(): Promise<BrandBrainData> {
  const raw = await apiRequest<ApiBrandBrain>("/brand-brain/confirm", "POST");
  return adaptBrandBrain(raw);
}

async function postDraft(path: string, body?: unknown): Promise<BlogDraft> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.error?.message ?? `Request failed (${res.status}).`;
    throw new Error(message);
  }
  return adaptBlogDraft(payload as ApiBlogDraft);
}

/** Generate + persist a grounded draft from a query-bank item (or a raw
 * keyword). Returns the new draft at status `in_review`. */
export async function generateDraft(
  input: { queryId: number } | { keyword: string },
): Promise<BlogDraft> {
  const body =
    "queryId" in input ? { query_id: input.queryId } : { keyword: input.keyword };
  return postDraft("/spotlight/drafts", body);
}

interface DraftStreamFrame {
  /** Live progress phrase while the agent works (Slice 1.5 SSE). */
  status?: string;
  /** A chunk of the article body as it is written (backend SPEC-114). */
  delta?: string;
  /** Id of the finished draft — the terminal success signal. */
  draft_id?: number;
  done?: boolean;
  error?: string;
  detail?: string;
}

/**
 * Streamed variant of {@link generateDraft}: POSTs to `/spotlight/drafts/stream`
 * and reads the agent's live progress as Server-Sent Events, exactly like the
 * AI-chat client (`services/chat.ts` `getAssistantReply`) — `fetch` +
 * `response.body.getReader()` + `TextDecoder`, splitting on the SSE frame
 * delimiter and stripping the `data: ` prefix. `onStatus` fires once per status
 * phrase; `onDelta` fires once per body chunk so the article renders live
 * (backend SPEC-114); the promise resolves the new draft's id. Throws on an
 * `error` frame, a non-OK response, or a stream that ends without a `draft_id`.
 *
 * `signal` (optional) aborts the underlying `fetch`/reader — the streaming
 * "new draft" surface passes one so a component unmount (route change, or the
 * dev StrictMode double-mount) cancels the in-flight generation instead of
 * leaving an orphan draft in the shared store.
 */
export async function generateDraftStream(
  input: { queryId: number } | { keyword: string },
  onStatus?: (status: string) => void,
  onDelta?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<number> {
  const body =
    "queryId" in input ? { query_id: input.queryId } : { keyword: input.keyword };
  const response = await fetch(`${BASE}/spotlight/drafts/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error?.message ?? `Request failed (${response.status}).`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let draftId: number | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      if (!frame.startsWith("data: ")) continue;
      let parsed: DraftStreamFrame;
      try {
        parsed = JSON.parse(frame.slice(6)) as DraftStreamFrame;
      } catch {
        continue;
      }
      if (parsed.error) {
        throw new Error(parsed.detail ?? parsed.error ?? "Draft generation failed.");
      }
      if (typeof parsed.delta === "string") onDelta?.(parsed.delta);
      if (parsed.status) onStatus?.(parsed.status);
      if (typeof parsed.draft_id === "number") draftId = parsed.draft_id;
    }
  }
  if (draftId === null) {
    throw new Error("The draft finished without an id — please try again.");
  }
  return draftId;
}

/**
 * Refine loop (backend SPEC-113): POST `/spotlight/drafts/{id}/regenerate` with
 * the owner's `prompt` and read the agent's live progress as Server-Sent Events,
 * reusing the exact reader of {@link generateDraftStream} — `fetch` +
 * `response.body.getReader()` + `TextDecoder`, splitting on the SSE frame
 * delimiter and stripping the `data: ` prefix. `onStatus` fires once per status
 * phrase; `onDelta` fires once per body chunk so the rewrite renders live
 * (backend SPEC-114); the promise resolves the regenerated draft's id (the SAME
 * id, now overwritten). Throws on an `error` frame, a non-OK response, or a
 * stream that ends without a `draft_id`.
 */
export async function regenerateDraftStream(
  id: number,
  prompt: string,
  onStatus?: (status: string) => void,
  onDelta?: (chunk: string) => void,
): Promise<number> {
  const response = await fetch(`${BASE}/spotlight/drafts/${id}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error?.message ?? `Request failed (${response.status}).`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let draftId: number | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      if (!frame.startsWith("data: ")) continue;
      let parsed: DraftStreamFrame;
      try {
        parsed = JSON.parse(frame.slice(6)) as DraftStreamFrame;
      } catch {
        continue;
      }
      if (parsed.error) {
        throw new Error(parsed.detail ?? parsed.error ?? "Regeneration failed.");
      }
      if (typeof parsed.delta === "string") onDelta?.(parsed.delta);
      if (parsed.status) onStatus?.(parsed.status);
      if (typeof parsed.draft_id === "number") draftId = parsed.draft_id;
    }
  }
  if (draftId === null) {
    throw new Error("The rewrite finished without an id — please try again.");
  }
  return draftId;
}

/** Approve a draft → status `approved`. (Publishing to Shopify is Slice 2.) */
export async function approveDraft(id: number): Promise<BlogDraft> {
  return postDraft(`/spotlight/drafts/${id}/approve`);
}

/** Send a draft back → status `changes_requested`. */
export async function requestChanges(id: number): Promise<BlogDraft> {
  return postDraft(`/spotlight/drafts/${id}/request-changes`);
}

/** Publish an approved/in-review draft to the live Shopify store (backend
 * SPEC-118) → status `published`, with `liveUrl` + `publishedAt` populated.
 * Publishing can fail (Shopify write/scope error) — the backend's message is
 * thrown so the caller can surface it inline. */
export async function publishDraft(id: number): Promise<BlogDraft> {
  return postDraft(`/spotlight/drafts/${id}/publish`);
}

/** Hide the live article but keep the record (backend SPEC-118) → status
 * `unpublished`. */
export async function unpublishDraft(id: number): Promise<BlogDraft> {
  return postDraft(`/spotlight/drafts/${id}/unpublish`);
}

/** Delete the live article from the site (backend SPEC-118): removes the Shopify
 * article and resets the draft (status back to `draft`). Returns the reset
 * draft; the Published tab uses it only as a success signal. */
export async function deleteFromSite(id: number): Promise<BlogDraft> {
  const raw = await apiRequest<ApiBlogDraft>(
    `/spotlight/drafts/${id}/published`,
    "DELETE",
  );
  return adaptBlogDraft(raw);
}

/** Hard-delete a draft (backend SPEC-112). Store-scoped server-side; throws the
 * backend's error message on a non-OK response. */
export async function deleteDraft(id: number): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/spotlight/drafts/${id}`, "DELETE");
}

/** Outcome of a hero (re)generation (backend SPEC-122). `hasHero` is false when
 * image-gen degraded gracefully server-side (never a thrown error for that);
 * `updatedAt` is the new cache-bust version for the banner (`heroUrl`). */
export interface GenerateHeroResult {
  hasHero: boolean;
  updatedAt: string | null;
}

/** (Re)generate the composited editorial hero for a draft (backend SPEC-122).
 * Human-triggered for cost control and slow by nature (gpt-image backdrop +
 * Pillow composite, ~15–40s), so callers show a "Designing your header…"
 * loading state. A non-OK response (e.g. draft missing) throws the backend's
 * message; an image-gen failure resolves to `{ hasHero: false }`. */
export async function generateHero(id: number): Promise<GenerateHeroResult> {
  const raw = await apiRequest<{ has_hero: boolean; updated_at: string | null }>(
    `/spotlight/drafts/${id}/hero`,
    "POST",
  );
  return { hasHero: raw.has_hero, updatedAt: raw.updated_at ?? null };
}
