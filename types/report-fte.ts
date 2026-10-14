/**
 * Report FTE (SPEC-256, live on the engine since SPEC-285) — the contract the UI reads
 * and backend SPEC-283 answers. Every figure is a string already formatted by the
 * backend's composer: the UI lays out, it never derives (root Rule 8).
 */

export type ReportCadence = "daily" | "weekly" | "monthly" | "season" | "on_demand";
export type ScheduleAuthority = "sends_alone" | "approve_each" | "off";
export type ReportKind = "scheduled" | "asked";
export type ValueTone = "neutral" | "good" | "warn" | "bad";
/** A run's lifecycle on the backend (SPEC-283). */
export type RunStatus = "draft" | "running" | "ready" | "sent" | "scheduled" | "failed";

export interface ReportTemplateSummary {
  id: string;
  name: string;
  cadence: ReportCadence;
  summary: string;
  sectionCount: number;
  toolCount: number;
  /** "Mon 07:00", "06:00 store time", "on demand". */
  runs: string;
  /** Backend SPEC-374: the apps each data section reads — `[]` is Shopify alone, several mean
   * any one of them. Absent from an older backend. */
  sectionApps?: string[][];
}

export interface DeliveredReport {
  id: string;
  title: string;
  kind: ReportKind;
  to: string;
  /** Formats and channel as a short line — "Weekly · PDF + in-app · opened by 2". */
  detail: string;
  openedAt: string | null;
  /** What decision followed, from the Results ledger; null when nothing yet. */
  actedOn: string | null;
  costUsd: number;
  /** ISO date-time. */
  deliveredAt: string;
  /** Composer route for the draft behind it, when one exists. */
  href?: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  runs: string;
  who: string;
  formats: string;
  authority: ScheduleAuthority;
  /** "Today", "15 Sep", or null when it has never run. */
  last: string | null;
  /** "Next 06:00", "Mon", "7 Oct". */
  next: string;
}

export interface ScorecardMetric {
  key: string;
  label: string;
  value: string;
  sub: string;
  tone: ValueTone;
}

export interface EmployeeCard {
  name: string;
  department: string;
  job: string;
  mayDoAlone: string;
  needsSignature: string;
  manager: string;
  judgedOn: string;
}

export interface DeskData {
  /** Grounded example asks — each one maps to a template the FTE can plan. */
  exampleAsks: string[];
  templates: ReportTemplateSummary[];
  templatesTotal: number;
  /** Backend SPEC-374: every template, for a guided workspace's runnable six. */
  allTemplates?: ReportTemplateSummary[];
  delivered: DeliveredReport[];
  scheduled: ScheduledReport[];
  employee: EmployeeCard;
  scorecard: ScorecardMetric[];
}

/* ── composer ─────────────────────────────────────────────────────────────── */

export interface PlanParam {
  label: string;
  value: string;
}

export interface PlanSection {
  id: string;
  /** 1-based, shown in the plan and the report. */
  index: number;
  title: string;
  /** The tool signature the section calls — `returns_summary(period, compare)`. */
  tool: string;
  /** How it is shown — "KPI strip", "table · sorted by return $". */
  viz: string;
  params: PlanParam[];
}

export interface ReportPlan {
  title: string;
  ask: string;
  audience: { label: string; params: PlanParam[] };
  period: { label: string; params: PlanParam[] };
  delivery: { label: string; params: PlanParam[] };
  sections: PlanSection[];
  /** The authority note shown under the Deliver panel while nothing has been sent. */
  authorityNote: string;
}

export interface KpiFigure {
  label: string;
  value: string;
  sub: string;
  tone: ValueTone;
}

export interface TableColumn {
  key: string;
  label: string;
  align: "left" | "right";
}

export interface TableCell {
  text: string;
  tone?: ValueTone;
}

export interface BarFigure {
  label: string;
  /** 0–1 share of the axis, precomputed by the producer. */
  share: number;
  priorShare: number;
  display: string;
}

export interface ReportSection {
  id: string;
  title: string;
  tool: string;
  grounded: boolean;
  kind: "kpis" | "table" | "bars" | "narrative";
  kpis?: KpiFigure[];
  columns?: TableColumn[];
  rows?: Record<string, TableCell>[];
  bars?: { items: BarFigure[]; axis: string[]; legend: [string, string] };
  /** Narrative paragraphs; a leading `**…**` span is rendered emphasised. */
  narrative?: string[];
  note?: string;
}

export interface TraceCall {
  sectionId: string;
  tool: string;
  args: string;
  /** Measured on the producer's side; the UI only displays it. */
  ms: number;
  costUsd?: number;
}

export interface ReportDraft {
  title: string;
  subtitle: string;
  preparedFor: string;
  computedAt: string;
  sections: ReportSection[];
  trace: TraceCall[];
}

/** One exchange in a run's edit-by-chat thread (SPEC-284). */
export interface Revision {
  at: string;
  message: string;
  reply: string;
  changes: string[];
}

export interface ComposerData {
  runId: number;
  status: RunStatus;
  plan: ReportPlan;
  draft: ReportDraft;
  revisions: Revision[];
  /** SPEC-343 — the schedule that made this run; absent on writes, null when asked by hand. */
  schedule?: RunSchedule | null;
}

export interface ReviseResult {
  run: ComposerData;
  reply: string;
  changes: string[];
  applied: boolean;
}

/* ── history ──────────────────────────────────────────────────────────────── */

export interface RunSummary {
  runId: number;
  title: string;
  kind: ReportKind;
  status: RunStatus;
  ask: string;
  templateId: string | null;
  createdAt: string | null;
  ranAt: string | null;
  costUsd: number;
  toolMs: number;
  sections: number;
  grounded: number;
  actedOn: string | null;
  deliveredAt: string | null;
  deliveredTo: string | null;
}

export interface HistoryData {
  runs: RunSummary[];
  total: number;
}

/** One SSE frame from `POST /report-fte/runs/{id}/execute` (SPEC-283). */
export type ExecuteEvent =
  | { event: "section" | "narrative"; planSectionId: string; sections: ReportSection[]; calls: TraceCall[] }
  | ({ event: "done" } & ComposerData)
  | { event: "error"; code: string; message: string };

export interface SendResult {
  deliveryId: number;
  /** The status line the backend wrote — including an unsent email's reason. */
  status: string;
  emailOk: boolean;
  emailError: string | null;
  channels: string[];
  recipients: string[];
}

export interface ScheduleResult {
  scheduleId: number;
  runs: string;
  next: string;
  authority: ScheduleAuthority;
  status: string;
  /** SPEC-343 — what was actually saved. */
  cadence?: ScheduleCadence;
  recipients?: string[];
  showOnReports?: boolean;
}

/* ── SPEC-343 / SPEC-335: real recipients, real schedules ─────────────────── */

export type ScheduleCadence = "daily" | "weekly" | "monthly";
export type ScheduleMode = "auto" | "ask";
export type RecipientKind = "owner" | "member" | "manager" | "location" | "role";

export interface RecipientOption {
  email: string;
  label: string;
  kind: RecipientKind;
}

export interface RecipientDirectory {
  items: RecipientOption[];
  /** The owner's address — what the dialogs start with. */
  default: string[];
}

export interface ScheduleChoice {
  cadence: ScheduleCadence;
  weekday: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  recipients: string[];
  mode: ScheduleMode;
  showOnReports: boolean;
}

/** The schedule a run was made by (`GET /report-fte/runs/{id}`). */
export interface RunSchedule {
  id: number;
  runs: string;
  cadence: string;
  authority: ScheduleAuthority;
  recipients: string[];
}

export interface OnReportsItem {
  id: number;
  title: string;
  schedule: string;
  ranAt: string | null;
  status: string;
  sentTo: string[];
}

export interface OnReportsData {
  cadence: ScheduleCadence;
  items: OnReportsItem[];
}

/* ── templates ────────────────────────────────────────────────────────────── */

export interface TemplateSectionDef {
  id: string;
  title: string;
  tools: string[];
  /** The binding line under the title — "period = the report's period · limit = 10". */
  binding: string;
  viz: string;
  on: boolean;
  /** The settings as label/value rows, for display. */
  params: PlanParam[];
  /** The settings as the backend stores them — round-tripped untouched on save. */
  settings: Record<string, string | number>;
  narrative: boolean;
  explainLinks: boolean;
}

export interface TemplateDetail {
  id: string;
  name: string;
  cadence: ReportCadence;
  runs: string;
  recipients: string;
  formats: string;
  scope: string;
  approvalBeforeSend: boolean;
  sendAutomatically: boolean;
  lastDelivered: string | null;
  sections: TemplateSectionDef[];
}

export interface SectionSuggestion {
  tool: string;
  description: string;
  title: string;
  viz: string;
  /** True for the "describe it instead" row that the FTE binds itself. */
  fromAsk?: boolean;
}

export interface TemplatesData {
  templates: ReportTemplateSummary[];
}

export interface TemplateData {
  template: TemplateDetail;
  suggestions: SectionSuggestion[];
}

/* ── delivered & scheduled ────────────────────────────────────────────────── */

export interface SampleEmail {
  from: string;
  to: string;
  subject: string;
  attachment: string;
  heading: string;
  kpis: KpiFigure[];
  lead: string[];
  footer: string;
}

export interface DeliveryChannel {
  label: string;
  sub: string;
  state: "on" | "off" | "later";
}

export interface DeliveredData {
  scheduled: ScheduledReport[];
  delivered: DeliveredReport[];
  sample: SampleEmail;
  channels: DeliveryChannel[];
}

/* ── profile ──────────────────────────────────────────────────────────────── */

export interface AuthorityRung {
  level: number;
  title: string;
  body: string;
}

export interface Guardrail {
  title: string;
  body: string;
  state: "on" | "ready";
}

export interface ShiftEntry {
  when: string;
  what: string;
  cadence: string;
}

export interface ProfileData {
  employee: EmployeeCard;
  hired: string;
  currentLevel: number;
  ladder: AuthorityRung[];
  promotionNote: string;
  guardrails: Guardrail[];
  scorecardMonth: string;
  scorecard: ScorecardMetric[];
  itsNumber: string;
  shift: ShiftEntry[];
}
