/**
 * The Customer Support Agent's Inbox — queue filters, sorting, selection and paging (SPEC-346).
 * Pure: the view state lives in the URL (`?tab=inbox&queue=&sort=&page=&ticket=`), and this
 * module reads it, writes it and orders the queue.
 */

import { CS_ROOT, PRIORITY_META, QUEUE_ORDER, slaClock } from "@/lib/customer-support";
import type { ChannelSla, QueueKey, SupportTicket } from "@/types/customer-support";

export type InboxSort = "risk" | "sla" | "newest";

export const INBOX_SORTS: { key: InboxSort; label: string }[] = [
  { key: "risk", label: "Revenue at risk" },
  { key: "sla", label: "SLA" },
  { key: "newest", label: "Newest" },
];

export const INBOX_PAGE_SIZE = 25;

export interface InboxView {
  queue: QueueKey;
  sort: InboxSort;
  page: number;
  ticket: string | null;
}

export const DEFAULT_INBOX_VIEW: InboxView = { queue: "needs_approval", sort: "risk", page: 1, ticket: null };

function isQueue(value: string | null): value is QueueKey {
  return value !== null && (QUEUE_ORDER as string[]).includes(value);
}

function isSort(value: string | null): value is InboxSort {
  return value === "risk" || value === "sla" || value === "newest";
}

export function inboxViewFrom(params: URLSearchParams): InboxView {
  const queue = params.get("queue");
  const sort = params.get("sort");
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    queue: isQueue(queue) ? queue : DEFAULT_INBOX_VIEW.queue,
    sort: isSort(sort) ? sort : DEFAULT_INBOX_VIEW.sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    ticket: params.get("ticket") || null,
  };
}

/** The Inbox's href for a view — defaults left out so the plain URL stays plain. */
export function inboxHref(view: Partial<InboxView>): string {
  const merged = { ...DEFAULT_INBOX_VIEW, ...view };
  const query = new URLSearchParams({ tab: "inbox" });
  if (merged.queue !== DEFAULT_INBOX_VIEW.queue) query.set("queue", merged.queue);
  if (merged.sort !== DEFAULT_INBOX_VIEW.sort) query.set("sort", merged.sort);
  if (merged.page > 1) query.set("page", String(merged.page));
  if (merged.ticket) query.set("ticket", merged.ticket);
  return `${CS_ROOT}?${query.toString()}`;
}

/**
 * Orders a queue. Revenue at risk is the backend's figure (customer lifetime value while the
 * ticket is at risk); tickets without one follow, by priority then age. SLA puts the least time
 * left first. Newest is by last update.
 */
export function sortTickets(tickets: SupportTicket[], sort: InboxSort, slas: ChannelSla[], now: Date): SupportTicket[] {
  const copy = [...tickets];
  const byNewest = (a: SupportTicket, b: SupportTicket) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0);
  if (sort === "newest") return copy.sort((a, b) => byNewest(a, b) || a.id.localeCompare(b.id));
  if (sort === "sla") {
    const left = (t: SupportTicket) => (t.firstResponseAt ? Number.POSITIVE_INFINITY : slaClock(t, slas, now).minutes);
    return copy.sort((a, b) => left(a) - left(b) || a.id.localeCompare(b.id));
  }
  const risk = (t: SupportTicket) => t.atRisk?.amount.amountMinor ?? -1;
  return copy.sort(
    (a, b) =>
      risk(b) - risk(a) ||
      PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank ||
      (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0) ||
      a.id.localeCompare(b.id),
  );
}

export function filterQueue(tickets: SupportTicket[], queue: QueueKey): SupportTicket[] {
  return tickets.filter((ticket) => ticket.queue === queue);
}

export interface Paged<T> {
  rows: T[];
  page: number;
  pages: number;
  total: number;
}

export function pageOf<T>(rows: T[], page: number, size = INBOX_PAGE_SIZE): Paged<T> {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages, total: rows.length };
}

/** The ticket to show: the one the URL names if it is on this page, else the page's first. */
export function selectedTicket(rows: SupportTicket[], wanted: string | null): SupportTicket | null {
  if (rows.length === 0) return null;
  return rows.find((ticket) => ticket.id === wanted) ?? rows[0];
}

/** j / k in the queue: the neighbour of the current ticket, clamped at the ends. */
export function neighbour(rows: { id: string }[], current: string | null, step: 1 | -1): string | null {
  if (rows.length === 0) return null;
  const index = rows.findIndex((row) => row.id === current);
  if (index === -1) return rows[0].id;
  return rows[Math.min(rows.length - 1, Math.max(0, index + step))].id;
}
