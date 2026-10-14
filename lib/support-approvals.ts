/**
 * The Customer Support Agent's Approvals — filters, sort and paging (SPEC-349, backend
 * SPEC-358). Pure: the view lives in the URL (`?tab=approvals&topic=&channel=&confidence=&q=
 * &sort=&page=`), and this module reads it, writes it and words the range.
 */

import { CS_ROOT, TOPIC_ORDER, type ConfidenceBand } from "@/lib/customer-support";
import type { Channel, TopicKey } from "@/types/customer-support";

export type ApprovalSort = "oldest" | "newest" | "confidence" | "value";

export const APPROVAL_SORTS: { key: ApprovalSort; label: string }[] = [
  { key: "oldest", label: "Oldest first" },
  { key: "newest", label: "Newest first" },
  { key: "confidence", label: "Lowest confidence" },
  { key: "value", label: "Highest customer value" },
];

export const CONFIDENCE_FILTERS: ConfidenceBand[] = ["high", "medium", "low"];

const CHANNELS: Channel[] = ["email", "chat", "sms", "facebook", "instagram", "whatsapp", "twitter", "phone", "contact_form", "help_center"];

export interface ApprovalsView {
  topic: TopicKey | null;
  channel: Channel | null;
  confidence: ConfidenceBand | null;
  q: string;
  sort: ApprovalSort;
  page: number;
}

export const DEFAULT_APPROVALS_VIEW: ApprovalsView = { topic: null, channel: null, confidence: null, q: "", sort: "oldest", page: 1 };

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function approvalsViewFrom(params: URLSearchParams): ApprovalsView {
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    topic: oneOf(params.get("topic"), TOPIC_ORDER),
    channel: oneOf(params.get("channel"), CHANNELS),
    confidence: oneOf(params.get("confidence"), CONFIDENCE_FILTERS),
    q: (params.get("q") ?? "").slice(0, 80),
    sort: oneOf(params.get("sort"), APPROVAL_SORTS.map((s) => s.key)) ?? DEFAULT_APPROVALS_VIEW.sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** The view's API query string — defaults left out, so equal views share one cache key. */
export function approvalsQuery(view: ApprovalsView): string {
  const query = new URLSearchParams();
  if (view.topic) query.set("topic", view.topic);
  if (view.channel) query.set("channel", view.channel);
  if (view.confidence) query.set("confidence", view.confidence);
  if (view.q.trim()) query.set("q", view.q.trim());
  if (view.sort !== DEFAULT_APPROVALS_VIEW.sort) query.set("sort", view.sort);
  if (view.page > 1) query.set("page", String(view.page));
  return query.toString();
}

/** The Approvals href for a view. A filter change goes back to page 1 unless a page is given. */
export function approvalsHref(view: ApprovalsView, change: Partial<ApprovalsView> = {}): string {
  const next = { ...view, ...change, page: change.page ?? (Object.keys(change).length ? 1 : view.page) };
  const rest = approvalsQuery(next);
  return `${CS_ROOT}?tab=approvals${rest ? `&${rest}` : ""}`;
}

export function hasFilters(view: ApprovalsView): boolean {
  return Boolean(view.topic || view.channel || view.confidence || view.q.trim());
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

/** "21–40 of 89" — or "None" when nothing matches. */
export function rangeLabel(page: number, pageSize: number, total: number): string {
  if (total <= 0) return "None";
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return `${first}–${last} of ${total}`;
}
