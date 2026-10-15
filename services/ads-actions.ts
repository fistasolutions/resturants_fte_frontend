/**
 * Performance Ads client mutations (backend SPEC-198, wired by SPEC-182).
 *
 * These run in `"use client"` code, so — like every other client mutation in the app —
 * they go through `/api/proxy`, which injects the httpOnly token server-side. Kept out
 * of `services/ads.ts` because that module is server-only.
 *
 * **Errors are surfaced, never swallowed.** The backend refuses an approval when the
 * kill switch is active or the monthly cap would be breached, and returns a 409 whose
 * message explains why. On a page that authorises spending, that message is the most
 * important thing on the screen — so it is thrown verbatim for the caller to display.
 */
import type { AdsSettings } from "@/types/ads";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";

async function request<T>(
  path: string,
  method: "POST" | "PATCH",
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

const post = <T,>(path: string, body?: unknown) => request<T>(path, "POST", body);
const patch = <T,>(path: string, body?: unknown) => request<T>(path, "PATCH", body);

export interface GateDecision {
  id: number;
  status: "approved" | "rejected";
  decided_at: string;
}

/** Approve a spend decision — the only path that launches a campaign or raises a cap.
 * Throws the backend's refusal message when blocked. */
export async function approveGate(gateId: string): Promise<GateDecision> {
  return post<GateDecision>(`/ads/gates/${gateId}/approve`);
}

/** Reject a spend decision. Nothing launches; the decision is still ledgered. */
export async function rejectGate(gateId: string): Promise<GateDecision> {
  return post<GateDecision>(`/ads/gates/${gateId}/reject`);
}

/** Pause a campaign. Always allowed — only STARTING spend is gated. */
export async function pauseCampaign(
  campaignId: string,
): Promise<{ id: number; status: string }> {
  return post(`/ads/campaigns/${campaignId}/pause`);
}

/** Create a campaign. It is always born a `draft` — only an approved spend gate can
 * make anything live, so the UI must never imply otherwise. */
export async function createCampaign(input: {
  name: string;
  channel: string;
  objective: string;
  persona: string;
  offer: string;
  daily_cap: string;
  total_cap: string;
  /** SPEC-387: a restaurant brand's branch campaign. */
  branch_id?: number;
}): Promise<{ id: number; status: string }> {
  return post("/ads/campaigns", input);
}

/** Set the store's monthly spend ceiling. Every approval is checked against it, so the
 * backend audits the change. */
export async function updateAdsSettings(
  monthlyCap: string,
): Promise<AdsSettings> {
  return patch<AdsSettings>("/ads/settings", { monthly_cap: monthlyCap });
}

/** Stop (or release) all ad spend. Turning it OFF does not restart anything —
 * campaigns stay paused and must each be approved again. */
export async function setKillSwitch(
  active: boolean,
  reason = "Operator stopped all ad spend.",
): Promise<Record<string, unknown>> {
  return post("/ads/kill-switch", { active, reason });
}
