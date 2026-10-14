/**
 * Customer Support Agent — writes (SPEC-346, backend SPEC-353), client-side through the proxy.
 *
 * Every call is one route of `/api/v1/customer-support/*`. The server re-checks every guardrail
 * before anything reaches a customer: a send the page thinks is fine is still refused with the
 * reasons (409 `support_send_blocked`), and the kill switch refuses the agent's replies (409
 * `support_kill_switch`) — never a person's own. Nothing here touches Shopify or Loop.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import { proxyUrl } from "@/lib/client-api";
import type { AutonomyLevel, Handoff, Playbook, Priority, SupportWorkspace, TopicKey } from "@/types/customer-support";

export interface ActionResult {
  ok?: boolean;
  message: string;
  /** For a send: queued (handed to the helpdesk), sent, or failed. */
  state?: "queued" | "sent" | "failed";
}

const ROOT = "/customer-support";

async function send(method: "POST" | "PUT" | "PATCH", path: string, body?: unknown): Promise<ActionResult> {
  const response = await fetch(proxyUrl(`${ROOT}${path}`), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return (await response.json()) as ActionResult;
}

/** A sent reply that the helpdesk refused comes back 200 with `ok: false` — the page says so. */
function settled(result: ActionResult): ActionResult {
  if (result.ok === false) throw new Error(result.message);
  return result;
}

const id = encodeURIComponent;

/** POST /tickets/{id}/reply — a person's own reply. */
export async function sendReply(ticketId: string, body: string): Promise<ActionResult> {
  return settled(await send("POST", `/tickets/${id(ticketId)}/reply`, { body }));
}

/** POST /approvals/{id}/approve — the agent's draft, as written or as edited. */
export async function approveReply(ticketId: string, body?: string): Promise<ActionResult> {
  return settled(await send("POST", `/approvals/${id(ticketId)}/approve`, body === undefined ? {} : { body }));
}

/** PUT /tickets/{id}/draft */
export function editDraft(ticketId: string, body: string): Promise<ActionResult> {
  return send("PUT", `/tickets/${id(ticketId)}/draft`, { body });
}

/** POST /tickets/{id}/draft — ask the agent for a fresh draft now. */
export function redraft(ticketId: string): Promise<ActionResult> {
  return send("POST", `/tickets/${id(ticketId)}/draft`);
}

/** POST /approvals/bulk-approve — bulk-safe topics only; the server checks each. */
export function bulkApprove(ticketIds: string[]): Promise<ActionResult> {
  return send("POST", "/approvals/bulk-approve", { ids: ticketIds });
}

/** POST /approvals/{id}/send-back — `reason` of 10+ characters. */
export function sendBack(ticketId: string, reason: string): Promise<ActionResult> {
  return send("POST", `/approvals/${id(ticketId)}/send-back`, { reason });
}

/** POST /approvals/{id}/reject */
export function rejectReply(ticketId: string): Promise<ActionResult> {
  return send("POST", `/approvals/${id(ticketId)}/reject`);
}

/** POST /tickets/{id}/handoff */
export function handOff(ticketId: string, handoff: Omit<Handoff, "ticketId" | "at">): Promise<ActionResult> {
  return send("POST", `/tickets/${id(ticketId)}/handoff`, {
    to: handoff.to.kind === "agent" ? { kind: "team", name: handoff.to.name } : handoff.to,
    summary: handoff.summary,
    nextStep: handoff.nextStep,
    priority: handoff.priority,
    reason: handoff.reason,
  });
}

/** POST /tickets/{id}/note */
export function addNote(ticketId: string, body: string): Promise<ActionResult> {
  return send("POST", `/tickets/${id(ticketId)}/note`, { body });
}

/** PATCH /tickets/{id} */
export function updateTicket(
  ticketId: string,
  patch: { priority?: Priority; snoozeHours?: number; close?: boolean; spam?: boolean },
): Promise<ActionResult> {
  return send("PATCH", `/tickets/${id(ticketId)}`, patch);
}

/** POST /messages/{id}/retry */
export async function retrySend(messageId: string): Promise<ActionResult> {
  return settled(await send("POST", `/messages/${id(messageId)}/retry`));
}

/** POST /outside-actions/{id}/done */
export function markOutsideDone(actionId: string): Promise<ActionResult> {
  return send("POST", `/outside-actions/${id(actionId)}/done`);
}

/** POST /kill-switch */
export function setKillSwitch(active: boolean): Promise<ActionResult> {
  return send("POST", "/kill-switch", { active });
}

/** PUT /autonomy */
export function setAutonomy(level: AutonomyLevel): Promise<ActionResult> {
  return send("PUT", "/autonomy", { level });
}

/** PUT /topics/{key} — its own autonomy (null follows the agent) and/or bulk-safe. */
export function setTopic(topic: TopicKey, patch: { autonomy?: AutonomyLevel | null; bulkSafe?: boolean }): Promise<ActionResult> {
  return send("PUT", `/topics/${topic}`, {
    ...(patch.autonomy !== undefined ? { autonomy: patch.autonomy, setAutonomy: true } : {}),
    ...(patch.bulkSafe !== undefined ? { bulkSafe: patch.bulkSafe } : {}),
  });
}

/** PUT /topics/{key}/playbook */
export function savePlaybook(topic: TopicKey, playbook: Omit<Playbook, "topic" | "updatedAt">): Promise<ActionResult> {
  return send("PUT", `/topics/${topic}/playbook`, playbook);
}

/** PUT /settings — guardrails, hours, SLAs, hand-off map. */
export function saveSettings(patch: Partial<Pick<SupportWorkspace, "guardrails" | "hours" | "slas" | "handoffMap">>): Promise<ActionResult> {
  return send("PUT", "/settings", patch);
}

/** POST /knowledge/gaps/{id}/answer — a pending Brand Brain fact, or a Gorgias macro. */
export function answerGap(gapId: string, target: "fact" | "macro", text: string): Promise<ActionResult> {
  return send("POST", `/knowledge/gaps/${id(gapId)}/answer`, { target, text });
}
