/**
 * Brand Brain v2 writes (SPEC-263) — every mutation the eight sub-tabs make, through
 * the proxy. Reads live in `lib/queries/brand-brain.ts`; the SPEC-111 fact/persona
 * CRUD stays in `services/spotlight-actions.ts`. Callers invalidate the
 * `["brand-brain"]` prefix (and `["spotlight", "brand-brain"]`) after a write.
 */

import {
  adaptBrandRule,
  adaptStyleTest,
  adaptBrandSource,
  adaptVoice,
  adaptVoiceCheck,
  type ApiBrandRule,
  type ApiBrandSource,
  type ApiVoice,
  type ApiVoiceCheck,
  type ApiStyleTest,
} from "@/lib/brand-brain";
import { adaptBrandFact, adaptBrandPersona, type ApiBrandBrainFact, type ApiBrandPersona } from "@/lib/adapters";
import {
  adaptCompetitor,
  adaptCompetitorRun,
  type ApiCompetitor,
  type ApiCompetitorRun,
} from "@/lib/competitors";
import type {
  BrandRule,
  BrandSource,
  Competitor,
  CompetitorRun,
  RuleKind,
  StyleSection,
  StylePrompt,
  StyleSurface,
  StyleTest,
  VoiceCheckResult,
  VoiceData,
  VoiceRule,
} from "@/types/brand-brain";
import type { Fact, Persona } from "@/types/spotlight";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

async function request<T>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error?.message ?? `Request failed (${res.status}).`);
  return payload as T;
}

/* ── Sources ─────────────────────────────────────────────────────────────── */

export interface SourceMeta {
  title?: string;
  tags?: string[];
}

export async function uploadSource(file: File, meta: SourceMeta = {}): Promise<BrandSource> {
  const form = new FormData();
  form.append("file", file, file.name);
  if (meta.title?.trim()) form.append("title", meta.title.trim());
  if (meta.tags?.length) form.append("tags", JSON.stringify(meta.tags));
  const res = await fetch(`${BASE}/brand-brain/sources`, { method: "POST", body: form });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error?.message ?? `Upload failed (${res.status}).`);
  return adaptBrandSource(payload as ApiBrandSource);
}

export async function addUrlSource(url: string, meta: SourceMeta = {}): Promise<BrandSource> {
  return adaptBrandSource(
    await request<ApiBrandSource>("/brand-brain/sources/url", "POST", {
      url,
      title: meta.title?.trim() || null,
      tags: meta.tags ?? [],
    }),
  );
}

export async function addTextSource(title: string, text: string, tags: string[] = []): Promise<BrandSource> {
  return adaptBrandSource(await request<ApiBrandSource>("/brand-brain/sources/text", "POST", { title, text, tags }));
}

export async function updateSource(id: number, meta: SourceMeta): Promise<BrandSource> {
  return adaptBrandSource(
    await request<ApiBrandSource>(`/brand-brain/sources/${id}`, "PATCH", { title: meta.title, tags: meta.tags }),
  );
}

/** The proxy path the browser downloads an uploaded source from. */
export function sourceFileHref(id: number): string {
  return `${BASE}/brand-brain/sources/${id}/file`;
}

export async function recheckSource(id: number): Promise<BrandSource> {
  return adaptBrandSource(await request<ApiBrandSource>(`/brand-brain/sources/${id}/recheck`, "POST"));
}

export async function deleteSource(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/brand-brain/sources/${id}`, "DELETE");
}

/* ── Fact status ─────────────────────────────────────────────────────────── */

export async function approveFact(id: number): Promise<Fact> {
  return adaptBrandFact(await request<ApiBrandBrainFact>(`/brand-brain/facts/${id}/approve`, "POST"));
}

export async function rejectFact(id: number): Promise<Fact> {
  return adaptBrandFact(await request<ApiBrandBrainFact>(`/brand-brain/facts/${id}/reject`, "POST"));
}

export async function approveAllFacts(sourceId?: number): Promise<number> {
  const query = sourceId ? `?source_id=${sourceId}` : "";
  const { approved } = await request<{ approved: number }>(`/brand-brain/facts/approve-all${query}`, "POST");
  return approved;
}

export async function setFactEnabled(id: number, enabled: boolean): Promise<Fact> {
  return adaptBrandFact(await request<ApiBrandBrainFact>(`/brand-brain/facts/${id}`, "PATCH", { enabled }));
}

/* ── Rules ───────────────────────────────────────────────────────────────── */

export interface RuleInput {
  kind: RuleKind;
  label: string;
  detail?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  /** The Style Guide section (backend SPEC-290) — required for a `style` rule. */
  section?: StyleSection | null;
}

export async function addRule(input: RuleInput): Promise<BrandRule> {
  return adaptBrandRule(
    await request<ApiBrandRule>("/brand-brain/rules", "POST", {
      kind: input.kind,
      label: input.label,
      detail: input.detail ?? null,
      starts_on: input.startsOn ?? null,
      ends_on: input.endsOn ?? null,
      section: input.section ?? null,
    }),
  );
}

export async function updateRule(
  id: number,
  patch: { label?: string; detail?: string; enabled?: boolean; startsOn?: string; endsOn?: string },
): Promise<BrandRule> {
  return adaptBrandRule(
    await request<ApiBrandRule>(`/brand-brain/rules/${id}`, "PATCH", {
      label: patch.label,
      detail: patch.detail,
      enabled: patch.enabled,
      starts_on: patch.startsOn,
      ends_on: patch.endsOn,
    }),
  );
}

export async function deleteRule(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/brand-brain/rules/${id}`, "DELETE");
}

/* ── The Style Guide's bench (backend SPEC-292) ──────────────────────────── */

export async function runStyleTest(input: {
  brief?: string;
  surface?: StyleSurface;
  productId?: number;
}): Promise<StyleTest> {
  return adaptStyleTest(
    await request<ApiStyleTest>("/brand-brain/style/tests", "POST", {
      brief: input.brief ?? null,
      surface: input.surface ?? "social",
      product_id: input.productId ?? null,
    }),
  );
}

export async function saveStylePrompt(surface: StyleSurface, prompt: string): Promise<StylePrompt> {
  return request<StylePrompt>("/brand-brain/style/prompt", "PUT", { surface, prompt });
}

export async function resetStylePrompt(surface: StyleSurface): Promise<StylePrompt> {
  return request<StylePrompt>(`/brand-brain/style/prompt?surface=${surface}`, "DELETE");
}

export async function deleteStyleTest(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/brand-brain/style/tests/${id}`, "DELETE");
}

/* ── Voice ───────────────────────────────────────────────────────────────── */

export async function addVoiceSample(text: string, channel?: string): Promise<void> {
  await request("/brand-brain/voice/samples", "POST", { text, channel: channel ?? null });
}

export async function deleteVoiceSample(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/brand-brain/voice/samples/${id}`, "DELETE");
}

export async function deriveVoice(): Promise<VoiceData> {
  return adaptVoice(await request<ApiVoice>("/brand-brain/voice/derive", "POST"));
}

export async function updateVoiceRule(
  id: number,
  patch: { title?: string; detail?: string; enabled?: boolean },
): Promise<VoiceRule> {
  const raw = await request<{ id: number; title: string; detail: string; enabled: boolean; provenance: string }>(
    `/brand-brain/voice/rules/${id}`,
    "PATCH",
    patch,
  );
  return {
    ...raw,
    provenance: raw.provenance === "manual" || raw.provenance === "file" ? raw.provenance : "derived",
    sourceId: null,
  };
}

/** Turn a voice rule down for good (backend SPEC-347 — a research finding the owner does not want). */
export async function deleteVoiceRule(id: number): Promise<void> {
  const res = await fetch(`${BASE}/brand-brain/voice/rules/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Request failed (${res.status}).`);
  }
}

export async function checkVoice(text: string): Promise<VoiceCheckResult> {
  return adaptVoiceCheck(await request<ApiVoiceCheck>("/brand-brain/voice/check", "POST", { text }));
}

/* ── Personas ────────────────────────────────────────────────────────────── */

export async function confirmPersona(id: number): Promise<Persona> {
  return adaptBrandPersona(await request<ApiBrandPersona>(`/brand-brain/personas/${id}/confirm`, "POST"));
}

/* ── Competitors (SPEC-283 over backend SPEC-280) ────────────────────────── */

/** Start the Find run — or get the one already running. */
export async function startCompetitorFind(): Promise<CompetitorRun> {
  return adaptCompetitorRun(await request<ApiCompetitorRun>("/brand-brain/competitors/find", "POST"));
}

export async function addCompetitor(input: { name: string; website: string; note?: string }): Promise<Competitor & { run: CompetitorRun | null }> {
  const raw = await request<ApiCompetitor>("/brand-brain/competitors", "POST", {
    name: input.name,
    website: input.website,
    note: input.note || undefined,
  });
  return { ...adaptCompetitor(raw), run: raw.run ? adaptCompetitorRun(raw.run) : null };
}

export async function approveCompetitor(id: number): Promise<Competitor> {
  return adaptCompetitor(await request<ApiCompetitor>(`/brand-brain/competitors/${id}/approve`, "POST"));
}

export async function rejectCompetitor(id: number): Promise<Competitor> {
  return adaptCompetitor(await request<ApiCompetitor>(`/brand-brain/competitors/${id}/reject`, "POST"));
}

export async function rereadCompetitor(id: number): Promise<CompetitorRun> {
  return adaptCompetitorRun(await request<ApiCompetitorRun>(`/brand-brain/competitors/${id}/reread`, "POST"));
}

/** The run to show a toast for right now — running, or just finished — else null. */
export async function getActiveCompetitorRun(signal?: AbortSignal): Promise<CompetitorRun | null> {
  const res = await fetch(`${BASE}/brand-brain/competitors/find/active`, { signal });
  if (!res.ok) return null;
  const payload = (await res.json()) as { run: ApiCompetitorRun | null };
  return payload.run ? adaptCompetitorRun(payload.run) : null;
}

/**
 * Follow one run over SSE (the same fetch + reader + frame split the chat and the
 * generation stream use). `onStep` fires per new step; `onEnd` once with the final
 * run. Resolves when the stream closes; `signal` aborts it.
 */
export async function streamCompetitorRun(
  runId: number,
  handlers: { onStep: (step: { at: string; label: string; done?: boolean }) => void; onEnd: (run: CompetitorRun) => void },
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/brand-brain/competitors/runs/${runId}/events`, {
    headers: { Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Run stream failed (${res.status}).`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index = buffer.indexOf("\n\n");
    while (index !== -1) {
      const frame = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (frame.startsWith("data: ")) {
        const payload = JSON.parse(frame.slice(6)) as Record<string, unknown>;
        if (payload.type === "step") {
          handlers.onStep({ at: String(payload.at), label: String(payload.label), done: Boolean(payload.done) });
        } else if (payload.type === "done" || payload.type === "failed") {
          handlers.onEnd(adaptCompetitorRun(payload as unknown as ApiCompetitorRun));
        }
      }
      index = buffer.indexOf("\n\n");
    }
  }
}
