/**
 * Blog-generation display logic (SPEC-216) — pure, so Vitest can reach it.
 *
 * The components stay presentational; every judgement lives here. That is how this repo
 * satisfies "no component test runner exists yet" (root Rule 4).
 */

export type GenerationStatus = "running" | "succeeded" | "failed";

export interface GenerationJob {
  id: number;
  status: GenerationStatus;
  step: string;
  message: string | null;
  roundsDone: number;
  bodyChars: number;
  draftId: number | null;
  error: string | null;
  keyword: string | null;
  queryId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
}

/** Characters → an approximate word count. The backend stores characters because
 * storing the token stream would be storing something we only throw away; ~5.5
 * characters per English word is close enough for a progress line and honest about
 * being approximate. */
export function approximateWords(bodyChars: number): number {
  if (bodyChars <= 0) return 0;
  return Math.round(bodyChars / 5.5);
}

/** "0:42" / "3:07". Generation runs for minutes, so elapsed time is the most useful
 * single number while there is nothing else to report. */
export function elapsedLabel(startedAt: string | null, now: Date = new Date()): string {
  if (!startedAt) return "0:00";
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return "0:00";
  const seconds = Math.max(0, Math.floor((now.getTime() - started) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** One generation at a time (backend SPEC-224). The button is DISABLED, never hidden —
 * a control that vanishes reads as a bug; one that is disabled and explains itself
 * does not. */
export function generateDisabledReason(job: GenerationJob | null): string | null {
  if (!job || job.status !== "running") return null;
  const subject = job.keyword ? `“${job.keyword}”` : "a blog";
  return `Already writing ${subject}. One at a time — this will finish first.`;
}

/** The single line the toast shows under its title. */
export function progressLine(job: GenerationJob): string {
  if (job.status === "failed") {
    return job.error ?? "The generation stopped. Nothing was saved.";
  }
  if (job.status === "succeeded") return "Draft ready — open it.";
  const words = approximateWords(job.bodyChars);
  if (words > 0) return `${job.step} · about ${words.toLocaleString()} words so far`;
  return job.message ?? job.step;
}

/** Where clicking the toast should take you: the finished draft once there is one,
 * otherwise the live generating surface. */
export function toastHref(job: GenerationJob): string {
  if (job.status === "succeeded" && job.draftId) {
    return `/spotlight/draft/${job.draftId}`;
  }
  const query =
    job.queryId != null
      ? `query_id=${job.queryId}`
      : job.keyword
        ? `keyword=${encodeURIComponent(job.keyword)}`
        : "";
  return query ? `/spotlight/draft/new?${query}` : "/spotlight";
}

/** Stop polling once there is nothing left to watch. An idle app should make no
 * traffic at all. */
export function shouldKeepPolling(job: GenerationJob | null): boolean {
  return job?.status === "running";
}
