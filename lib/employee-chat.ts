/**
 * The employee chat's pure half (SPEC-293 / backend SPEC-287): who the employee is
 * and what it offers, the thread bookkeeping a send needs, and the cards a reply
 * carries. No fetch, no React — Vitest covers it. The hook in
 * `features/spotlight/employee-chat/` owns state; this decides.
 */

import type { ChatConversation, ChatMessage, ChatSources, EmployeeCard } from "@/types/chat";

export type EmployeeId = "spotlight" | "finance" | "email_marketing" | "customer_support";

export interface EmployeeMeta {
  id: EmployeeId;
  name: string;
  /** Two-letter monogram for the tile. */
  monogram: string;
  role: string;
  /** What it can do, in the owner's words — the empty state. */
  offers: string[];
  /** The starter asks under the empty state; "Write about …" prefills the composer. */
  starters: { label: string; text: string; prefill?: boolean }[];
  /** The composer placeholder. */
  placeholder: string;
}

export const SPOTLIGHT_EMPLOYEE: EmployeeMeta = {
  id: "spotlight",
  name: "Search Visibility",
  monogram: "SV",
  role: "Search-content employee",
  offers: [
    "Tell it what to write — it starts the article here and the draft waits in Needs review.",
    "Ask what to write next — it answers from today's picks and the page-two topics.",
    "Ask about any topic, pick or draft — every figure comes from its tools.",
  ],
  starters: [
    { label: "What should I write next?", text: "What should I write next?" },
    { label: "Show me today's picks", text: "Show me today's picks and why each is there." },
    { label: "Which topics sit on page two?", text: "Which topics sit on page two, and what would a page-one move win?" },
    { label: "Write about …", text: "Write about ", prefill: true },
  ],
  placeholder: "Tell Search Visibility what to write, or ask about a topic, a pick or a draft…",
};

/** Finance Oversight (SPEC-301 / backend SPEC-295) — read tools only: it answers from
 * the synced books and never pays, edits or schedules anything. */
export const FINANCE_EMPLOYEE: EmployeeMeta = {
  id: "finance",
  name: "Accounts Payable",
  monogram: "AP",
  role: "Bills-and-payments employee",
  offers: [
    "Ask what is late, what is due this week, or what a company owes — across all three companies.",
    "Ask what to pay this week — it answers from the payment run, in the order to pay.",
    "Ask about any vendor or bill — every figure comes from the synced QuickBooks books.",
  ],
  starters: [
    { label: "What's late?", text: "What's late across all three companies?" },
    { label: "What should I pay this week?", text: "What should I pay this week, and in what order?" },
    { label: "Which vendors do we owe most?", text: "Which vendors do we owe the most?" },
    { label: "Anything that looks wrong?", text: "Is there anything that looks wrong — a duplicate, an unusual amount, a new vendor?" },
  ],
  placeholder: "Ask about bills, vendors, cash or what Finance has saved you…",
};

/** Email Marketing Manager (SPEC-345 / backend SPEC-354): threads filed under
 * `conversations.employee = "email_marketing"`, answered with read tools only. */
export const EMAIL_MARKETING_EMPLOYEE: EmployeeMeta = {
  id: "email_marketing",
  name: "Email Marketing Manager",
  monogram: "EM",
  role: "Email & SMS employee",
  offers: [
    "Ask it to plan the next week or month — it answers from stock, margin, the season and each customer's repeat clock.",
    "Ask what to build — it points you to the campaign builder or the missing flow, and nothing sends without your approval.",
    "Ask why a send did well or badly — it answers with the sales the email caused, not just what the email platform claims.",
  ],
  starters: [
    { label: "Plan next week", text: "Plan next week." },
    { label: "Which flows are we missing?", text: "Which flows are we missing, and what are they worth a month?" },
    { label: "Did the last campaign cause sales?", text: "Did the last campaign actually cause sales, or would they have bought anyway?" },
    { label: "Ask about …", text: "How is ", prefill: true },
  ],
  placeholder: "Ask Email Marketing Manager about the plan, a send, a flow or deliverability…",
};

/** Customer Support Agent (SPEC-346). Its replies stream from the preview's own sample data
 * until the backend files threads under `conversations.employee = "customer_support"`. */
export const CUSTOMER_SUPPORT_EMPLOYEE: EmployeeMeta = {
  id: "customer_support",
  name: "Customer Support Agent",
  monogram: "CS",
  role: "Customer support employee",
  offers: [
    "Ask what customers are writing about — it answers from this week's tickets and turns them into fixes.",
    "Ask it to draft a reply or a policy answer — it writes from the real order, return, fit and stock, and nothing sends without you.",
    "Ask why a figure moved — CSAT, first response, hand-offs — and it opens the tickets behind it.",
  ],
  starters: [
    { label: "What are customers angry about this week?", text: "What are customers angry about this week?" },
    { label: "Draft a reply for late orders", text: "Draft a policy reply for late orders from the East fulfilment centre." },
    { label: "Why did CSAT drop?", text: "Why did CSAT drop on Tuesday?" },
    { label: "Ask about a topic …", text: "How are we doing on ", prefill: true },
  ],
  placeholder: "Ask the Customer Support Agent about tickets, topics, replies or CSAT…",
};

export const EMPLOYEES: Record<EmployeeId, EmployeeMeta> = {
  spotlight: SPOTLIGHT_EMPLOYEE,
  finance: FINANCE_EMPLOYEE,
  email_marketing: EMAIL_MARKETING_EMPLOYEE,
  customer_support: CUSTOMER_SUPPORT_EMPLOYEE,
};

/** Where the last-opened thread is remembered, per employee, per browser. */
export function lastThreadKey(employee: EmployeeId): string {
  return `employee-chat:${employee}:last`;
}

/** The cards a stored or streamed reply carries — only kinds this UI can draw. */
export function cardsFrom(sources: ChatSources | null | undefined): EmployeeCard[] {
  return (sources?.cards ?? []).filter(
    (card) => card.kind === "generation" && typeof card.job_id === "number",
  );
}

/** A thread's title, as the backend derives it: the first words of the first ask. */
export function threadTitleFrom(text: string, max = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** A new, empty thread the rail can show at once — the backend creates the row on
 * the first send with the same id. */
export function newThread(id: string, title: string, now: string): ChatConversation {
  return { id, title, createdAt: now, updatedAt: now, messages: [], projectId: null, pinnedAt: null };
}

/** The owner's turn appended to a thread (pure). */
export function withUserTurn(thread: ChatConversation, message: ChatMessage): ChatConversation {
  return { ...thread, updatedAt: message.createdAt, messages: [...thread.messages, message] };
}

/** The reply appended to a thread — with its stored id and provenance (pure). */
export function withReply(
  thread: ChatConversation,
  reply: { id: string; content: string; createdAt: string; sources: ChatSources | null },
): ChatConversation {
  const message: ChatMessage = {
    id: reply.id,
    role: "assistant",
    content: reply.content,
    createdAt: reply.createdAt,
    sources: reply.sources,
  };
  return { ...thread, updatedAt: reply.createdAt, messages: [...thread.messages, message] };
}

/** Replace one thread in a list (or add it at the top), keeping newest-updated first. */
export function upsertThread(threads: ChatConversation[], thread: ChatConversation): ChatConversation[] {
  const rest = threads.filter((t) => t.id !== thread.id);
  return [thread, ...rest].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** The thread to open on return: the remembered one when it still exists, else the
 * newest, else none. */
export function threadToOpen(threads: ChatConversation[], remembered: string | null): string | null {
  if (remembered && threads.some((t) => t.id === remembered)) return remembered;
  return threads[0]?.id ?? null;
}

/** "Just now" / "3:07 PM" / "Sep 21" — the rail's time, short enough for one line. */
export function threadTimeLabel(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const diff = now.getTime() - at.getTime();
  if (diff < 60_000) return "Just now";
  if (at.toDateString() === now.toDateString()) {
    return at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
