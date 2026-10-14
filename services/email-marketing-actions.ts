/**
 * Email Marketing Manager writes (SPEC-345, backend SPEC-354), client-side through the proxy.
 *
 * Every call is one route of `/api/v1/email-marketing/*`. The server re-checks every guardrail
 * before anything reaches Klaviyo: an approve the page thinks is fine is still refused with the
 * reasons (409 `email_guardrails_blocked`, each reason in `details`), and the kill switch refuses
 * every send (409). Callers invalidate `["email-marketing"]` after each write
 * (`use-email-marketing-actions.ts`), so the views re-read the source of truth.
 *
 * Consent is never written: the one subscribe the backend makes is the owner's seed list.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import type {
  AutonomyLevel,
  CampaignGoal,
  ContentBlock,
  EmailCampaign,
  Flow,
  FlowStatus,
  Guardrails,
  KillSwitchResult,
  SendStrategy,
  SenderDefaults,
} from "@/types/email-marketing";

const ROOT = "/email-marketing";
const id = encodeURIComponent;

async function call<T>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  const response = await fetch(proxyUrl(`${ROOT}${path}`), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

/** `PUT /connection` — checks the key against Klaviyo; a refused key is a 422 and nothing is
 * stored. Without a key it reconnects with the one already stored for the store. */
export function connectProvider(privateKey: string | null): Promise<unknown> {
  return call("PUT", "/connection", privateKey ? { private_key: privateKey } : {});
}

/** `DELETE /connection` — the employee stops; the key stays on the Integrations page. */
export function disconnectProvider(): Promise<void> {
  return call("DELETE", "/connection");
}

/** `POST /sync` — read campaigns, flows, audiences and profiles from Klaviyo now. */
export function syncNow(): Promise<unknown> {
  return call("POST", "/sync");
}

export function setAutonomy(level: AutonomyLevel): Promise<void> {
  return call("PUT", "/autonomy", { level });
}

export function setProgramAutonomy(program: string, level: AutonomyLevel | null): Promise<void> {
  return call("PUT", `/programs/${id(program)}/autonomy`, { level });
}

export function saveGuardrails(guardrails: Guardrails): Promise<void> {
  return call("PUT", "/guardrails", guardrails);
}

export function saveSender(sender: SenderDefaults): Promise<void> {
  return call("PUT", "/sender", sender);
}

export function setKillSwitch(active: boolean, reason: string): Promise<KillSwitchResult> {
  return call("POST", "/kill-switch", { active, reason });
}

/** What a draft is saved as — the server recomputes the estimate, exclusions and profit. */
export interface CampaignInput {
  name: string;
  goal: CampaignGoal;
  subject: string;
  previewText: string;
  blocks: ContentBlock[];
  audienceKeys: string[];
  excludedKeys: string[];
  offer: { kind: "none" } | { kind: "discount" | "free_shipping"; code: string };
  strategy: SendStrategy;
  holdoutPercent: number;
  variants: number;
}

/** `POST /campaigns` (new) or `PUT /campaigns/{id}` (an existing draft). */
export function saveCampaign(input: CampaignInput, campaignId: string | null): Promise<EmailCampaign> {
  return campaignId ? call("PUT", `/campaigns/${id(campaignId)}`, input) : call("POST", "/campaigns", input);
}

/** `POST /campaigns/{id}/review` — into the approvals queue (autopilot sends a clean one). */
export function requestReview(campaignId: string): Promise<EmailCampaign> {
  return call("POST", `/campaigns/${id(campaignId)}/review`);
}

/** `POST /campaigns/{id}/test` — a [TEST] copy to the seed list; returns the tested ids. */
export function sendSeedTest(campaignId: string): Promise<string[]> {
  return call("POST", `/campaigns/${id(campaignId)}/test`);
}

/** `POST /campaigns/{id}/approve` — `typed` is the recipient count, over the threshold. */
export function approveCampaign(campaignId: string, typed: string | null): Promise<EmailCampaign> {
  return call("POST", `/campaigns/${id(campaignId)}/approve`, { typed });
}

export function cancelCampaign(campaignId: string): Promise<EmailCampaign> {
  return call("POST", `/campaigns/${id(campaignId)}/cancel`);
}

/** `POST /flows/{key}/build` — a lifecycle flow, built in Klaviyo as a draft. */
export function buildFlow(lifecycleKey: string): Promise<Flow> {
  return call("POST", `/flows/${id(lifecycleKey)}/build`);
}

export function setFlowStatus(flowId: string, status: Exclude<FlowStatus, "missing">): Promise<Flow> {
  return call("POST", `/flows/${id(flowId)}/status`, { status });
}

export function saveFlowMessage(flowId: string, messageId: string, subject: string, previewText: string): Promise<Flow> {
  return call("PUT", `/flows/${id(flowId)}/messages/${id(messageId)}`, { subject, previewText });
}

/** `POST /audiences/{key}/sync` — mirrors a segment's consented members to a Klaviyo list. */
export function syncAudience(key: string): Promise<{ externalId: string; added: number; removed: number }> {
  return call("POST", `/audiences/${id(key)}/sync`);
}

export function decideApproval(
  approvalId: string,
  decision: "approve" | "send_back" | "reject",
  reason: string | null,
  typed: string | null = null,
): Promise<void> {
  return call("POST", `/approvals/${id(approvalId)}/decide`, { decision, reason, typed });
}

export function acceptPlanSlot(slotId: string): Promise<void> {
  return call("POST", `/plan/${id(slotId)}/accept`);
}

export function rejectPlanSlot(slotId: string, reason: string): Promise<void> {
  return call("POST", `/plan/${id(slotId)}/reject`, { reason });
}

export function movePlanSlot(slotId: string, date: string): Promise<void> {
  return call("POST", `/plan/${id(slotId)}/move`, { date });
}

/** `POST /plan/refresh` — proposes the next four weeks from today's facts; a decided slot is never touched. */
export function refreshPlan(): Promise<{ added: number }> {
  return call("POST", "/plan/refresh");
}
