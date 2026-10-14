/**
 * Finance Oversight writes (SPEC-299) — client-side, through the proxy.
 *
 * "Writes" means our own database: connect, sync now, disconnect. Nothing here changes
 * anything in QuickBooks, which stays the system of record (backend SPEC-294 enforces
 * that with an invariant test). Reads live in `lib/queries/finance.ts`; callers
 * invalidate the `["finance"]` prefix afterwards.
 */
import { proxyUrl } from "@/lib/client-api";

export class FinanceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FinanceRequestError";
  }
}

async function fail(response: Response, fallback: string): Promise<FinanceRequestError> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return new FinanceRequestError(
    body?.error?.message ?? `${fallback} (${response.status}).`,
    response.status,
  );
}

async function post<T>(path: string, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(path), { method: "POST" });
  if (!response.ok) throw await fail(response, fallback);
  return (await response.json()) as T;
}

/** Where to send the browser to pick a company. The signed state expires in ten
 * minutes, so this is requested at the moment of the click, never earlier. */
export async function quickBooksAuthorizeUrl(): Promise<string> {
  const body = await post<{ authorize_url: string }>(
    "/finance/connect",
    "Starting the QuickBooks connection failed",
  );
  return body.authorize_url;
}

export interface SyncSummary {
  companies: { company: string; bills: number; vendors: number; removed: number; error: string | null }[];
  bills: number;
  connected: number;
  failed: number;
  /** SPEC-339: another process was already reading these books; nothing was read. */
  busy?: boolean;
  message?: string | null;
}

/** The owner's "refresh". Returns per-company counts, including what failed and why. */
export async function syncQuickBooks(): Promise<SyncSummary> {
  return post<SyncSummary>("/finance/sync", "Syncing QuickBooks failed");
}

/** Every company at once (SPEC-331 / backend SPEC-339) — each revoked at Intuit and each
 * one's data removed. Returns how many were disconnected. */
export async function disconnectAllQuickBooks(): Promise<number> {
  const response = await fetch(proxyUrl("/finance/connections"), { method: "DELETE" });
  if (!response.ok) throw await fail(response, "Disconnecting the companies failed");
  const body = (await response.json()) as { removed: number };
  return body.removed;
}

/** `1 <currency> = rate <reporting currency>` for a currency QuickBooks cannot quote. */
export async function setExchangeRate(currency: string, rate: number): Promise<void> {
  const response = await fetch(proxyUrl(`/finance/fx/${encodeURIComponent(currency)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate }),
  });
  if (!response.ok) throw await fail(response, "Saving the exchange rate failed");
}

/** Forgets the company and its bills. 404 means it is already gone. */
export async function disconnectQuickBooks(connectionId: number): Promise<void> {
  const response = await fetch(proxyUrl(`/finance/connections/${connectionId}`), {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw await fail(response, "Disconnecting the company failed");
  }
}

// ── the value ledger (SPEC-330 / backend SPEC-338) ──────────────────────────

async function send<T>(method: "POST" | "PUT", path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await fail(response, fallback);
  return (await response.json()) as T;
}

/** "Not a problem": the finding leaves what is at stake; a cleared duplicate stops
 * flagging both copies, so the payment run includes the bill again. */
export async function dismissFinding(findingId: number, reason: string): Promise<void> {
  await send("POST", `/finance/findings/${findingId}/dismiss`, { reason }, "Clearing the finding failed");
}

export async function restoreFinding(findingId: number): Promise<void> {
  await send("POST", `/finance/findings/${findingId}/restore`, undefined, "Restoring the finding failed");
}

/** Any subset of the five value assumptions; the backend names a value it refuses. */
export async function saveValueAssumptions(values: Record<string, number>): Promise<void> {
  await send("PUT", "/finance/value/assumptions", values, "Saving the assumptions failed");
}
