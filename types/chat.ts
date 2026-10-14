export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Plain text; assistant replies may contain simple line breaks and "- " bullets. */
  content: string;
  /** ISO timestamp. */
  createdAt: string;
  /** Which model answered, when the conversation overrode the system default
   * (SPEC-238 / backend SPEC-245); absent otherwise. */
  model?: string | null;
  temperature?: number | null;
  /** What grounded an assistant turn (SPEC-240 / backend SPEC-247). */
  sources?: ChatSources | null;
  /** The reader's rating: 1, -1, or null. */
  feedback?: number | null;
  /** SPEC-249 / backend SPEC-255: pinned to the top of its thread (ISO), or null. */
  pinnedAt?: string | null;
}

/** A folder of conversations (SPEC-249 / backend SPEC-255). */
export interface ChatProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  conversationCount: number;
  /** SPEC-255: one of `PROJECT_COLORS` / `PROJECT_ICONS` in `lib/project-style.ts`. */
  color: string;
  icon: string;
}

/** What the project dialog collects (SPEC-255). */
export interface ChatProjectStyle {
  color: string;
  icon: string;
}

export interface ChatSourceChip {
  kind: "page" | "product" | "order" | "location";
  label: string;
  /** A same-origin route the chip opens. */
  href: string;
}

export interface ChatSources {
  /** True when at least one backend tool ran for this answer. */
  grounded: boolean;
  /** The connected systems those tools read, e.g. ["Shopify", "Loop Returns"]. */
  systems: string[];
  tools: string[];
  chips: ChatSourceChip[];
  /** SPEC-257 / backend SPEC-259: at most one chart, from the tools' own numbers. */
  visual?: AnswerVisual | null;
  /** SPEC-259 / backend SPEC-260: the review page(s) that act on what the tools read. */
  actions?: AnswerAction[];
  /** SPEC-262: the watch this answer created, from the tool's own output. */
  watch?: AnswerWatch | null;
  /** SPEC-264 / backend SPEC-265: the receipt — one row per tool call, in order. */
  calls?: AnswerCall[];
  /** SPEC-264: how fresh each system's data was when the answer was written. */
  freshness?: AnswerFreshness[];
  /** SPEC-293 / backend SPEC-287: what an employee's doing-tool started on this turn. */
  cards?: EmployeeCard[];
}

/** A card an employee's turn carries (backend SPEC-287): a background run the
 * thread shows live and after a reload. Only `generation` exists today. */
export interface EmployeeCard {
  kind: string;
  job_id?: number;
  keyword?: string;
  query_id?: number | null;
  note?: string;
  /** `link` cards (SPEC-346 / backend SPEC-353): a screen the answer points to. */
  label?: string;
  href?: string;
}

/** One tool call's receipt row (backend SPEC-265). */
export interface AnswerCall {
  tool: string;
  system: string;
  /** The call's own arguments, as "period 30d · query Katie Dress". */
  asked: string;
  /** Up to six figures picked from the tool's JSON. */
  returned: { key: string; value: string }[];
  ms: number;
}

/** A system the answer read and when it was last synced (null = no sync row). */
export interface AnswerFreshness {
  system: string;
  synced_at: string | null;
  records: number;
}

/** The watch a `set_watch` call stored (backend SPEC-262) — enough for the card. */
export interface AnswerWatch {
  id: number;
  rule: string;
  current: string;
  notify_nudge: boolean;
  notify_email: string | null;
  href: string;
}

/** A page whose review/send flow acts on an answer's figures (backend SPEC-260). */
export interface AnswerAction {
  label: string;
  href: string;
  /** `send` emails a manager from that page (the primary button); `review` acts on it. */
  kind: "send" | "review";
}

export type AnswerVisualKind = "bar" | "line" | "compare";
export type AnswerVisualUnit = "currency" | "number" | "percent";

export interface AnswerVisualPoint {
  label: string;
  value: number;
}

export interface AnswerVisualSeries {
  name: string;
  points: AnswerVisualPoint[];
}

/** A chart the backend derived from a tool's output (backend SPEC-259). */
export interface AnswerVisual {
  kind: AnswerVisualKind;
  title: string;
  unit: AnswerVisualUnit;
  /** The metric key the chart is about, e.g. "revenue". */
  metric: string;
  /** The tool whose output it came from, e.g. "get_top_products". */
  tool: string;
  series: AnswerVisualSeries[];
}

/** A conversation's own model choice (SPEC-238). Either field may be absent:
 * a temperature alone applies to the system default model. */
export interface ChatModelOverride {
  model?: string;
  temperature?: number;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
}

export interface ChatConversation {
  id: string;
  /** Auto-derived from the first user message; "New chat" until then. */
  title: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  /** SPEC-249: the project it is filed in, or null. */
  projectId?: string | null;
  /** SPEC-249: pinned to the rail's Pinned section (ISO), or null. */
  pinnedAt?: string | null;
}

/** The date range a page is showing, as sent with a drawer question (SPEC-236). */
export interface ChatPageRange {
  label: string;
  /** ISO YYYY-MM-DD, inclusive. */
  start: string;
  end: string;
}

/**
 * Where the owner was when they asked (SPEC-236 / backend SPEC-243). Mirrors the
 * backend's `ChatPageContext`: ids are resolved to names server-side.
 */
export interface ChatPageContext {
  route: string;
  page: string;
  tab?: string;
  range?: ChatPageRange;
  product_id?: number;
  order_id?: number;
  customer_id?: number;
  location_id?: number;
  /** The card the owner pressed ✦ Explain on, as printed (SPEC-242 / backend SPEC-249). */
  focus?: string;
  /** Text the owner highlighted and asked about (SPEC-243 / backend SPEC-250). */
  selection?: string;
}

/** `GET /chat/voice/status` (backend SPEC-268). */
export interface VoiceStatus {
  available: boolean;
  reason: string | null;
  /** The card that speaks (SPEC-269), or null when none can. */
  provider: "openai" | "gemini" | null;
  voice: string;
  options: Array<{ provider: "openai" | "gemini"; label: string; available: boolean; active: boolean }>;
}
