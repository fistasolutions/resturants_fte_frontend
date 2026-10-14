/**
 * URL-param parsing + query building for the Gorgias Conversation Log
 * (SPEC-094, backend SPEC-088). Pure and unit-tested. The list fetch, client
 * pagination, and the CSV export href all share `conversationsApiQuery` so they
 * can never drift apart.
 */

const STATUS_PATTERN = /^[a-z_]{1,32}$/;

export interface ConversationFilters {
  status: string | null;
  agentId: number | null;
  reason: string | null;
  q: string;
  page: number;
}

export function parseConversationFilters(
  params: Record<string, string | undefined>,
): ConversationFilters {
  const status =
    params.status && STATUS_PATTERN.test(params.status) ? params.status : null;
  const agentRaw = Number.parseInt(params.agent_id ?? "", 10);
  const agentId = Number.isFinite(agentRaw) && agentRaw > 0 ? agentRaw : null;
  return {
    status,
    agentId,
    reason: (params.reason ?? "").trim().slice(0, 120) || null,
    q: (params.q ?? "").trim().slice(0, 120),
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
}

/**
 * Query string for `GET /gorgias/conversations` and `.../export`. `start`/`end`
 * come from the resolved shared date range; `limit`/`offset` only for the list
 * fetch (omitted on export, which streams the whole filtered set).
 */
export function conversationsApiQuery(
  filters: ConversationFilters,
  start: string,
  end: string,
  limit?: number,
  offset?: number,
): string {
  const params = new URLSearchParams();
  params.set("start", start);
  params.set("end", end);
  if (filters.status) params.set("status", filters.status);
  if (filters.agentId !== null) params.set("agent_id", String(filters.agentId));
  if (filters.reason) params.set("reason", filters.reason);
  if (filters.q) params.set("search", filters.q);
  if (limit !== undefined) {
    // The backend paginates by page/page_size; convert the shared offset model.
    params.set("page", String(Math.floor((offset ?? 0) / limit) + 1));
    params.set("page_size", String(limit));
  }
  return params.toString();
}
