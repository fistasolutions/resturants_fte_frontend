/**
 * Background blog generation (backend SPEC-224, wired by SPEC-216).
 *
 * Client-side, through `/api/proxy`, because the toast polls from a `"use client"`
 * provider mounted in the app shell — it has to work on every page, not just server
 * components.
 *
 * A **409** is not swallowed: "a blog is already being generated" is the answer to the
 * click, not an error to hide.
 */
import type { GenerationJob } from "@/lib/generation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

interface ApiJob {
  id?: number;
  status?: string;
  step?: string;
  message?: string | null;
  rounds_done?: number;
  body_chars?: number;
  draft_id?: number | null;
  error?: string | null;
  keyword?: string | null;
  query_id?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
}

/** Absent numbers become 0 and absent ids become null — never `undefined` leaking into
 * a progress line, and never `NaN` in a word count. */
export function adaptJob(raw: ApiJob | null): GenerationJob | null {
  if (!raw || typeof raw.id !== "number") return null;
  const status = raw.status === "succeeded" || raw.status === "failed" ? raw.status : "running";
  return {
    id: raw.id,
    status,
    step: typeof raw.step === "string" ? raw.step : "Working",
    message: typeof raw.message === "string" ? raw.message : null,
    roundsDone: typeof raw.rounds_done === "number" ? raw.rounds_done : 0,
    bodyChars: typeof raw.body_chars === "number" ? raw.body_chars : 0,
    draftId: typeof raw.draft_id === "number" ? raw.draft_id : null,
    error: typeof raw.error === "string" ? raw.error : null,
    keyword: typeof raw.keyword === "string" ? raw.keyword : null,
    queryId: typeof raw.query_id === "number" ? raw.query_id : null,
    startedAt: typeof raw.started_at === "string" ? raw.started_at : null,
    finishedAt: typeof raw.finished_at === "string" ? raw.finished_at : null,
  };
}

/** Raised when the caller aborted — a cleared poll interval or a navigation. The caller
 * should ignore it: nothing failed, the question simply stopped mattering. */
export class RequestAborted extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new RequestAborted("aborted");
    }
    throw cause;
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error?.message ?? `Request failed (${res.status}).`);
  }
  return payload as T;
}

/** Start a generation. Throws the backend's 409 message verbatim when one is already
 * running — that message is the useful answer. */
export async function startGeneration(
  seed: { queryId: number } | { keyword: string },
): Promise<GenerationJob | null> {
  const body = "queryId" in seed ? { query_id: seed.queryId } : { keyword: seed.keyword };
  return adaptJob(
    await request<ApiJob>("/spotlight/generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** Rewrite one published post against the searches it is missing (backend SPEC-302).
 *
 * Returns the SAME job shape `startGeneration` does — the rewrite runs on the existing
 * refine loop, so the progress toast and the generating screen need no second path.
 * A 409 ("a blog is already being generated") and a 404 ("nothing in striking distance
 * this week") both surface verbatim: each is the answer to the click. */
export async function startRefreshRewrite(draftId: number): Promise<GenerationJob | null> {
  return adaptJob(
    await request<ApiJob>(`/spotlight/refresh/${draftId}`, { method: "POST" }),
  );
}

/** The store's running generation, or null. Polled by the provider — this is what makes
 * the toast survive a hard refresh. */
export async function getActiveGeneration(
  signal?: AbortSignal,
): Promise<GenerationJob | null> {
  return adaptJob(await request<ApiJob | null>("/spotlight/generation", { signal }));
}

/** One job by id — how the generating screen follows a run it did not start. */
export async function getGeneration(jobId: number): Promise<GenerationJob | null> {
  return adaptJob(await request<ApiJob>(`/spotlight/generation/${jobId}`));
}
