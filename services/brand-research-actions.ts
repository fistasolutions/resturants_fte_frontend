/**
 * The Brand Researcher's writes and live stream (SPEC-341, backend SPEC-347), through the
 * proxy. The review itself is read through `brandBrainQueries.researchReview()`; callers
 * invalidate `["brand-brain"]` after a write.
 */
import {
  adaptResearchReview,
  adaptResearchRun,
  type ApiResearchReview,
  type ApiResearchRun,
} from "@/lib/brand-research";
import type { ResearchFound, ResearchReview, ResearchRun } from "@/types/brand-research";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

async function post<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST" });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error?.message ?? `Request failed (${res.status}).`);
  return payload as T;
}

/** Research the brand now — or the run already going. */
export async function startBrandResearch(): Promise<ResearchRun> {
  return adaptResearchRun(await post<ApiResearchRun>("/brand-brain/research"));
}

/** The run the toast restores after a reload: running, or finished and not yet seen. */
export async function getActiveBrandResearch(signal?: AbortSignal): Promise<ResearchRun | null> {
  const res = await fetch(`${BASE}/brand-brain/research/active`, { signal });
  if (!res.ok) return null;
  const payload = (await res.json()) as { run: ApiResearchRun | null };
  return payload.run ? adaptResearchRun(payload.run) : null;
}

/** The owner opened the review or dismissed the toast — it is not offered again. */
export async function markBrandResearchSeen(runId: number): Promise<void> {
  await post<ApiResearchRun>(`/brand-brain/research/runs/${runId}/seen`);
}

export async function approveAllResearch(): Promise<{ approved: Partial<ResearchFound>; review: ResearchReview }> {
  const raw = await post<{ approved: Partial<ResearchFound>; review: ApiResearchReview }>(
    "/brand-brain/research/review/approve-all",
  );
  return { approved: raw.approved, review: adaptResearchReview(raw.review) };
}

/**
 * Follow one run over SSE: `onRun` with the whole run whenever it changes, `onEnd` once with
 * the finished run. Resolves when the stream closes; `signal` aborts it.
 */
export async function streamBrandResearch(
  runId: number,
  handlers: { onRun: (run: ResearchRun) => void; onEnd: (run: ResearchRun) => void },
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/brand-brain/research/runs/${runId}/events`, {
    headers: { Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Research stream failed (${res.status}).`);
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
        const payload = JSON.parse(frame.slice(6)) as { type?: string; run?: ApiResearchRun };
        if (payload.run) {
          const run = adaptResearchRun(payload.run);
          if (payload.type === "done" || payload.type === "failed") handlers.onEnd(run);
          else handlers.onRun(run);
        }
      }
      index = buffer.indexOf("\n\n");
    }
  }
}
