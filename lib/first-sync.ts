/**
 * The first sync, as the app shows it (SPEC-314 over backend SPEC-316) — pure.
 * Each backend step names the pages its data unlocks (`reveals`); a page none of the
 * steps names never waits.
 */
import type { BootstrapDetail, BootstrapPayload } from "@/lib/onboarding";

/** The page a path belongs to — the key the backend's `reveals` use. */
export function pageKey(pathname: string): string {
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  if (parts.length === 0) return "dashboard";
  if (parts[0] === "employees" && parts[1] === "finance") return "finance";
  return parts[0];
}

export function gatedKeys(payload: BootstrapPayload): Set<string> {
  return new Set(payload.steps.flatMap((step) => step.reveals));
}

export function revealedKeys(payload: BootstrapPayload): Set<string> {
  const done = new Set(payload.steps_done);
  return new Set(payload.steps.filter((s) => done.has(s.key)).flatMap((s) => s.reveals));
}

/** Whether the page at `pathname` has its data. `null` (no store, or never read) is ready:
 * the gate only ever holds a page back on a sync it can see running. */
export function pathReady(pathname: string, payload: BootstrapPayload | null): boolean {
  if (payload === null || payload.state === "done") return true;
  const key = pageKey(pathname);
  return !gatedKeys(payload).has(key) || revealedKeys(payload).has(key);
}

export interface ToastView {
  tone: "running" | "done" | "failed";
  title: string;
  fraction: number;
  lines: { key: string; title: string; state: "done" | "running" | "waiting" }[];
  detail: string;
}

export function toastView(payload: BootstrapPayload): ToastView {
  const done = new Set(payload.steps_done);
  const lines = payload.steps.map((step) => ({
    key: step.key,
    title: step.title,
    state: done.has(step.key)
      ? ("done" as const)
      : payload.step === step.key
        ? ("running" as const)
        : ("waiting" as const),
  }));
  const fraction = payload.steps.length ? done.size / payload.steps.length : 0;
  if (payload.state === "done") {
    return { tone: "done", title: "Your store is fully synced", fraction: 1, lines, detail: "Every screen is ready." };
  }
  if (payload.state === "failed") {
    return {
      tone: "failed",
      title: "The first sync stopped",
      fraction,
      lines,
      detail: payload.error ?? "It stopped before it finished.",
    };
  }
  return {
    tone: "running",
    title: "Syncing your store",
    fraction,
    lines,
    detail: "Runs in the background — keep working. Each screen opens as its data lands.",
  };
}

/** A friendly name for a waiting page. */
export function pageLabel(key: string): string {
  return key === "dashboard" ? "store's figures" : key.replace(/-/g, " ");
}

/** SPEC-370: a well-formed `detail`, or null. */
export function toDetail(value: unknown): BootstrapDetail | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as { now?: unknown; done?: unknown };
  if (typeof raw.now !== "string") return null;
  const done: Record<string, number> = {};
  if (typeof raw.done === "object" && raw.done !== null) {
    for (const [key, count] of Object.entries(raw.done as Record<string, unknown>)) {
      if (typeof count === "number") done[key] = count;
    }
  }
  return { now: raw.now, done };
}

/** One SSE `data:` payload, or `null` for anything that is not a bootstrap frame. */
export function parseFrame(data: string): BootstrapPayload | null {
  try {
    const value = JSON.parse(data) as Partial<BootstrapPayload>;
    if (typeof value.state !== "string" || !Array.isArray(value.steps)) return null;
    return {
      state: value.state as BootstrapPayload["state"],
      step: value.step ?? null,
      steps_done: Array.isArray(value.steps_done) ? value.steps_done : [],
      steps: value.steps,
      error: value.error ?? null,
      detail: toDetail(value.detail),
    };
  } catch {
    return null;
  }
}
