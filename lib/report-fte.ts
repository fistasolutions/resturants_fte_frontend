/**
 * Pure helpers for the Report FTE views (SPEC-256): the composer's state machine,
 * ask → template routing, tile building, labels and filters. Nothing here computes a
 * business figure — every number arrives formatted from the producer (root Rule 8).
 */
import type { StripTile } from "@/lib/kpi-strip";
import type { StatusTone } from "@/components/shared/status-badge";
import type {
  DeskData,
  ReportCadence,
  ReportSection,
  ReportTemplateSummary,
  RunStatus,
  ScheduleAuthority,
  ScorecardMetric,
  TraceCall,
} from "@/types/report-fte";

/* ── scorecard tiles ──────────────────────────────────────────────────────── */

export function scorecardTiles(metrics: ScorecardMetric[]): StripTile[] {
  return metrics.map((m) => ({
    key: m.key,
    label: m.label,
    value: m.value,
    delta: null,
    invertDelta: false,
    sub: m.sub,
    tone: m.tone,
  }));
}

/* ── ask → template ───────────────────────────────────────────────────────── */

const ASK_ROUTES: Array<{ pattern: RegExp; templateId: string }> = [
  { pattern: /\breturn/i, templateId: "returns-by-brand" },
  { pattern: /brand review|buying|season/i, templateId: "brand-review" },
  { pattern: /discount|\bcodes?\b/i, templateId: "discount-decisions" },
  { pattern: /store league|footfall|conversion/i, templateId: "store-league" },
  { pattern: /\btax\b/i, templateId: "tax-pack" },
  { pattern: /customer health|quiet|vip/i, templateId: "customer-health" },
  { pattern: /stock|inventory|reorder/i, templateId: "stock-to-watch" },
  { pattern: /yesterday|three lines|today/i, templateId: "yesterday" },
  { pattern: /week|trading/i, templateId: "trading-week" },
];

/**
 * Which template an ask most plausibly wants — routing, not analysis. The real FTE
 * plans on the backend (`plan_report`); the UI only needs a title for the composer
 * header before the plan arrives. Falls back to "Custom report".
 */
export function templateForAsk(
  ask: string,
  templates: ReportTemplateSummary[],
): { templateId: string | null; title: string } {
  const text = ask.trim();
  if (!text) return { templateId: null, title: "Custom report" };
  for (const route of ASK_ROUTES) {
    if (route.pattern.test(text)) {
      const match = templates.find((t) => t.id === route.templateId);
      if (match) return { templateId: match.id, title: match.name };
    }
  }
  return { templateId: null, title: "Custom report" };
}

/* ── composer state machine ───────────────────────────────────────────────── */

export type ComposerPhase = "idle" | "running" | "ready" | "sent" | "scheduled";

export interface ComposerState {
  phase: ComposerPhase;
  /** Section ids whose tool call has completed, in order. */
  completed: string[];
  /** The plan section the user is adjusting, if any. */
  editing: string | null;
  /** The status line under the Deliver buttons. */
  status: string;
  statusTone: "neutral" | "sent";
}

export type ComposerAction =
  | { type: "run" }
  | { type: "section_done"; sectionId: string }
  | { type: "sections_done"; sectionIds: string[] }
  | { type: "finish"; toolCount: number; elapsed: string; status?: string }
  | { type: "fail"; message: string }
  | { type: "send"; to: string; at: string; status?: string }
  | { type: "schedule"; runs: string; status?: string }
  | { type: "edit"; sectionId: string | null }
  | { type: "reset"; status: string };

export function initialComposerState(status: string): ComposerState {
  return { phase: "idle", completed: [], editing: null, status, statusTone: "neutral" };
}

/**
 * The state a run reopens in (SPEC-285): a run that already ran shows every section,
 * a sent one reopens as sent, a failed one as idle with the failure on the status line.
 */
export function hydrateComposerState(
  runStatus: RunStatus,
  sectionIds: string[],
  authorityNote: string,
  computedAt: string,
): ComposerState {
  switch (runStatus) {
    case "ready":
      return { phase: "ready", completed: sectionIds, editing: null, status: `Plan ran · ${computedAt}. Ready for your signature.`, statusTone: "neutral" };
    case "sent":
      return { phase: "sent", completed: sectionIds, editing: null, status: "Approved and delivered · recorded in Delivered.", statusTone: "sent" };
    case "scheduled":
      return { phase: "scheduled", completed: sectionIds, editing: null, status: "Approved and scheduled · see Delivered & scheduled.", statusTone: "sent" };
    case "failed":
      return { phase: "idle", completed: [], editing: null, status: "The last run failed before the report was ready — run the plan again.", statusTone: "neutral" };
    default:
      return initialComposerState(authorityNote);
  }
}

/** Replaces or appends the composed sections a frame carries, keeping plan order. */
export function mergeSections(existing: ReportSection[], incoming: ReportSection[]): ReportSection[] {
  const byId = new Map(existing.map((s, index) => [s.id, index]));
  const next = [...existing];
  for (const section of incoming) {
    const base = section.id.split("-")[0];
    const at = byId.get(section.id);
    if (at !== undefined) {
      next[at] = section;
      continue;
    }
    // An extra block (`s1-b2`) sits right after the last section of its family.
    let insertAt = next.length;
    for (let i = next.length - 1; i >= 0; i -= 1) {
      if (next[i].id.split("-")[0] === base) {
        insertAt = i + 1;
        break;
      }
    }
    next.splice(insertAt, 0, section);
    byId.clear();
    next.forEach((s, index) => byId.set(s.id, index));
  }
  return next;
}

/** Replaces the trace's placeholder call for a tool with the measured one. */
export function mergeTrace(existing: TraceCall[], incoming: TraceCall[]): TraceCall[] {
  const next = [...existing];
  for (const call of incoming) {
    const at = next.findIndex((c) => c.sectionId === call.sectionId && c.tool === call.tool);
    if (at >= 0) next[at] = call;
    else next.push(call);
  }
  return next;
}

/** The transitions the composer allows; anything else is ignored, never thrown. */
export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case "run":
      if (state.phase === "running") return state;
      return { ...state, phase: "running", completed: [], editing: null };
    case "section_done":
      if (state.phase !== "running" || state.completed.includes(action.sectionId)) return state;
      return { ...state, completed: [...state.completed, action.sectionId] };
    case "sections_done": {
      if (state.phase !== "running") return state;
      const fresh = action.sectionIds.filter((id) => !state.completed.includes(id));
      return fresh.length ? { ...state, completed: [...state.completed, ...fresh] } : state;
    }
    case "finish":
      if (state.phase !== "running") return state;
      return {
        ...state,
        phase: "ready",
        status: action.status ?? `Plan ran · ${action.toolCount} tools · ${action.elapsed} — every figure grounded. Ready for your signature.`,
      };
    case "fail":
      if (state.phase !== "running") return state;
      return { ...state, phase: "idle", status: action.message, statusTone: "neutral" };
    case "send":
      // SPEC-335: an approved report can be sent again, to more people.
      if (state.phase !== "ready" && state.phase !== "scheduled" && state.phase !== "sent") return state;
      return {
        ...state,
        phase: "sent",
        status: action.status ?? `Approved by the owner · sent to ${action.to} at ${action.at} as PDF + in-app · recorded in Delivered.`,
        statusTone: "sent",
      };
    case "schedule":
      // SPEC-335: a schedule can be changed after it is saved.
      if (state.phase !== "ready" && state.phase !== "sent" && state.phase !== "scheduled") return state;
      return {
        ...state,
        phase: "scheduled",
        status: action.status ?? `Scheduled · ${action.runs} · approve each until you say otherwise.`,
        statusTone: "sent",
      };
    case "edit":
      if (state.phase === "running") return state;
      return { ...state, editing: action.sectionId };
    case "reset":
      return initialComposerState(action.status);
    default:
      return state;
  }
}

/** "3 of 5" / "5 of 5 grounded" — the trace header's count. */
export function traceProgress(completed: number, total: number): { label: string; tone: StatusTone } {
  if (total === 0) return { label: "no tools", tone: "neutral" };
  if (completed >= total) return { label: `${total} of ${total} grounded`, tone: "success" };
  if (completed === 0) return { label: `0 of ${total}`, tone: "neutral" };
  return { label: `${completed} of ${total}`, tone: "ai" };
}

/** Formats a producer-measured duration for the trace — "412 ms", "6.2 s". */
export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

/* ── labels ───────────────────────────────────────────────────────────────── */

export const CADENCE_LABEL: Record<ReportCadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  season: "Season",
  on_demand: "On demand",
};

export const CADENCE_FILTERS: Array<{ key: ReportCadence | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "season", label: "Season" },
  { key: "on_demand", label: "On demand" },
];

/**
 * Whether a template can run on what is connected (SPEC-365): one of its data sections reads
 * Shopify alone, or an app that is connected. A template that does not say what it reads (a
 * custom one, an older backend) always can.
 */
export function canRun(template: ReportTemplateSummary, connected: ReadonlySet<string>): boolean {
  const sections = template.sectionApps;
  if (!sections || sections.length === 0) return true;
  return sections.some((apps) => apps.length === 0 || apps.some((app) => connected.has(app)));
}

/** The templates to offer: for a guided workspace only those that can run; for a full one
 * (FOC) every one, as before. */
export function offeredTemplates(
  templates: ReportTemplateSummary[],
  guided: boolean,
  connected: ReadonlySet<string>,
): ReportTemplateSummary[] {
  return guided ? templates.filter((t) => canRun(t, connected)) : templates;
}

/** The Desk's six and its "All n": a guided workspace's first six that can run, out of every
 * template; a full one's, exactly as the backend sent them. */
export function deskTemplates(
  data: Pick<DeskData, "templates" | "templatesTotal" | "allTemplates">,
  guided: boolean,
  connected: ReadonlySet<string>,
): { templates: ReportTemplateSummary[]; total: number } {
  if (!guided || !data.allTemplates) return { templates: data.templates, total: data.templatesTotal };
  const runnable = offeredTemplates(data.allTemplates, true, connected);
  return { templates: runnable.slice(0, 6), total: runnable.length };
}

export function filterTemplates(
  templates: ReportTemplateSummary[],
  cadence: ReportCadence | "all",
): ReportTemplateSummary[] {
  return cadence === "all" ? templates : templates.filter((t) => t.cadence === cadence);
}

export function authorityLabel(authority: ScheduleAuthority): { label: string; tone: StatusTone } {
  switch (authority) {
    case "sends_alone":
      return { label: "Sends alone", tone: "success" };
    case "approve_each":
      return { label: "Approve each", tone: "warning" };
    default:
      return { label: "Off", tone: "neutral" };
  }
}

/** Splits a narrative paragraph into its emphasised lead (`**…**`) and the rest. */
export function splitLead(paragraph: string): { lead: string | null; rest: string } {
  const match = /^\*\*([^*]+?)\*\*\s*([\s\S]*)$/.exec(paragraph);
  if (!match) return { lead: null, rest: paragraph };
  return { lead: match[1], rest: match[2] };
}
