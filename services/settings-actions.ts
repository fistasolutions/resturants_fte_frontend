/**
 * Settings writes (SPEC-324 over backend SPEC-331) — your name, password and sessions, the
 * organization's name and calendar, and billing self-service. Client-side, through the proxy,
 * throwing the shared `ApiError` so a panel shows the backend's own words. Reads live in
 * `lib/queries/{account,organization,billing}.ts`.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import {
  deletionFrom,
  type DeletionScheduled,
  type DeletionScheduledApi,
} from "@/lib/organization-lifecycle";

async function send<T = void>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ── your account ─────────────────────────────────────────────────────────────

export async function updateMyName(name: string): Promise<{ name: string; email: string }> {
  return send("/auth/me", "PATCH", { name: name.trim() });
}

export async function changePassword(currentPassword: string | null, newPassword: string): Promise<void> {
  await send("/auth/password", "POST", {
    ...(currentPassword ? { current_password: currentPassword } : {}),
    new_password: newPassword,
  });
}

export async function signOutSession(sessionId: string): Promise<void> {
  await send(`/auth/sessions/${encodeURIComponent(sessionId)}`, "DELETE");
}

export async function signOutOtherSessions(): Promise<void> {
  await send("/auth/sessions/revoke-others", "POST");
}

// ── the organization ─────────────────────────────────────────────────────────

export async function updateOrganization(input: {
  name?: string;
  calendar?: "gregorian" | "hebrew";
}): Promise<void> {
  await send("/organizations/current/settings", "PUT", {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.calendar !== undefined
      ? { calendar_system: input.calendar === "hebrew" ? "hebrew" : null }
      : {}),
  });
}

// ── billing ──────────────────────────────────────────────────────────────────

/** A Stripe customer-portal URL that returns to the Billing tab. */
export async function openBillingPortal(): Promise<string> {
  return (await send<{ url: string }>("/billing/portal", "POST", { return_path: "/settings/billing" })).url;
}

/** A Stripe Checkout URL for the plan that comes back to the Billing tab. */
export async function startPlanCheckout(planKey: string): Promise<string> {
  return (
    await send<{ url: string }>("/billing/checkout", "POST", { plan_key: planKey, return_to: "settings" })
  ).url;
}

/** Without Stripe (the preview), a plan is chosen directly. */
export async function choosePlanDirect(planKey: string): Promise<void> {
  await send("/billing/subscription", "POST", { plan_key: planKey });
}

export async function confirmPlanCheckout(sessionId: string): Promise<void> {
  await send("/billing/checkout/confirm", "POST", { session_id: sessionId });
}

/** SPEC-384: buy AI credit for this month. Returns a Stripe checkout URL, or a dummy-mode grant. */
export interface TopupResult {
  provider: "stripe" | "dummy";
  checkout_url?: string;
  granted?: boolean;
  credit_cents?: number;
}

export async function buyAiCredit(creditCents: number): Promise<TopupResult> {
  return send<TopupResult>("/billing/ai-topup", "POST", { credit_cents: creditCents });
}

// ── leaving the platform (SPEC-332 over backend SPEC-340) ──────────────────────

/** Lock the organization now and erase it in 30 days. Owner only. */
export async function deleteOrganization(confirm: string): Promise<DeletionScheduled> {
  return deletionFrom(
    await send<DeletionScheduledApi>("/organizations/current/deletion", "POST", { confirm }),
  );
}

/** Undo a deletion inside its 30 days. Public: the signed link is the credential. */
export async function restoreOrganization(token: string): Promise<void> {
  await send("/auth/organization-restore", "POST", { token });
}
