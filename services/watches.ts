/**
 * Watchlist writes (SPEC-262) — client-side, through the proxy. Reads live in
 * `lib/queries/watches.ts`.
 */
import {
  toWatch,
  toWatchCheck,
  type ApiWatch,
  type ApiWatchCheck,
} from "@/lib/watch-adapter";
import { proxyUrl } from "@/lib/client-api";
import type { Watch, WatchCheckResult, WatchInput, WatchPatch } from "@/types/watch";

export class WatchRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Product candidates when the name matched several (409). */
    readonly candidates: string[] = [],
  ) {
    super(message);
    this.name = "WatchRequestError";
  }
}

async function fail(response: Response, fallback: string): Promise<WatchRequestError> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string; details?: { field: string; message: string }[] } }
    | null;
  const candidates = (body?.error?.details ?? [])
    .filter((d) => d.field === "product_query")
    .map((d) => d.message);
  return new WatchRequestError(
    body?.error?.message ?? `${fallback} (${response.status}).`,
    response.status,
    candidates,
  );
}

export async function createWatch(input: WatchInput): Promise<Watch> {
  const response = await fetch(proxyUrl("/watches"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metric: input.metric,
      direction: input.direction,
      threshold: input.threshold,
      product_query: input.productQuery ?? null,
      period: input.period ?? null,
      notify_nudge: input.notifyNudge ?? true,
      notify_email: input.notifyEmail ?? null,
    }),
  });
  if (!response.ok) throw await fail(response, "Creating the watch failed");
  return toWatch((await response.json()) as ApiWatch);
}

export async function updateWatch(id: number, patch: WatchPatch): Promise<Watch> {
  const body: Record<string, unknown> = {};
  if (patch.direction !== undefined) body.direction = patch.direction;
  if (patch.threshold !== undefined) body.threshold = patch.threshold;
  if (patch.period !== undefined) body.period = patch.period;
  if (patch.notifyNudge !== undefined) body.notify_nudge = patch.notifyNudge;
  if (patch.notifyEmail !== undefined) body.notify_email = patch.notifyEmail;
  if (patch.status !== undefined) body.status = patch.status;
  const response = await fetch(proxyUrl(`/watches/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await fail(response, "Updating the watch failed");
  return toWatch((await response.json()) as ApiWatch);
}

/** Idempotent — 404 means it is already gone. */
export async function removeWatch(id: number): Promise<void> {
  const response = await fetch(proxyUrl(`/watches/${id}`), { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw await fail(response, "Deleting the watch failed");
}

export async function checkWatches(): Promise<WatchCheckResult> {
  const response = await fetch(proxyUrl("/watches/check"), { method: "POST" });
  if (!response.ok) throw await fail(response, "Checking the watches failed");
  return toWatchCheck((await response.json()) as ApiWatchCheck);
}
