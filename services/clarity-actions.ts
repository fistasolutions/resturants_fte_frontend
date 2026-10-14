/**
 * Microsoft Clarity — client mutations (backend SPEC-270). Through `/api/proxy`
 * like every client mutation; kept out of `services/clarity.ts`, which is the
 * server-only read face of `lib/queries/clarity.ts`.
 */
import { adaptClarityStatus } from "@/lib/adapters";
import type { ClarityStatus } from "@/types/clarity";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

/** A failed Clarity action with the backend's error code (`clarity_sync_running`,
 * `clarity_budget_exhausted`, `clarity_not_configured`). */
export class ClarityActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "ClarityActionError";
  }
}

/** Sync now / Retry: start a pull off the request; the status query shows it running. */
export async function syncClarityNow(): Promise<ClarityStatus> {
  const res = await fetch(`${BASE}/clarity/sync`, { method: "POST" });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ClarityActionError(
      payload?.error?.message ?? `Request failed (${res.status}).`,
      res.status,
      payload?.error?.code ?? null,
    );
  }
  return adaptClarityStatus(payload as Record<string, unknown>);
}
