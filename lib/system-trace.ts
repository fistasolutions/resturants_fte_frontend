/**
 * System-trace logic (SPEC-228).
 *
 * All the deciding lives here rather than in the components, because the repo has no
 * jsdom runner — `lib/` is where correctness is provable and components stay
 * presentational.
 *
 * The one rule that shapes this file: **health is computed by the backend, against
 * each job's own cadence, and the UI never recomputes it.** A daily job and a
 * 15-minute job cannot share a staleness threshold, and re-deriving that here would
 * be a second source of truth that drifts from the first.
 */

import type {
  JobHealth,
  JobRun,
  RunPage,
  RunStatus,
  SystemJob,
  SystemOverview,
  SystemTotals,
} from "@/types/system";

// ── Filter option sets — data, so they are testable and cannot drift from the API ──

export const WINDOWS = [
  { key: "all", label: "All time" },
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
] as const;

export const STATUSES = [
  { key: "", label: "All outcomes" },
  { key: "error", label: "Failed" },
  { key: "success", label: "Succeeded" },
  { key: "skipped", label: "Skipped" },
  { key: "running", label: "Running" },
] as const;

export type WindowKey = (typeof WINDOWS)[number]["key"];

export function isWindow(value: string | undefined): value is WindowKey {
  return WINDOWS.some((w) => w.key === value);
}

export function isStatus(value: string | undefined): value is RunStatus {
  return value === "error" || value === "success" || value === "skipped" || value === "running";
}

// ── Adapters — snake_case API → camelCase view model ─────────────────────────

interface RawRun {
  id: number;
  job_id: string;
  title?: string;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  outcome: Record<string, number | string> | null;
  detail: string | null;
  error: string | null;
  trace_id: string | null;
}

export function adaptRun(raw: RawRun): JobRun {
  return {
    id: raw.id,
    jobId: raw.job_id,
    title: raw.title,
    status: raw.status,
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
    durationMs: raw.duration_ms,
    outcome: raw.outcome,
    detail: raw.detail,
    error: raw.error,
    traceId: raw.trace_id,
  };
}

export function adaptOverview(raw: {
  generated_at: string;
  jobs: Array<Record<string, unknown>>;
  totals: Record<string, number>;
}): SystemOverview {
  return {
    generatedAt: raw.generated_at,
    jobs: raw.jobs.map((job) => ({
      key: job.key as string,
      title: job.title as string,
      purpose: job.purpose as string,
      group: job.group as string,
      cadenceLabel: job.cadence_label as string,
      cadenceMinutes: job.cadence_minutes as number,
      expected: job.expected as boolean,
      health: job.health as JobHealth,
      lastSuccessAt: (job.last_success_at as string | null) ?? null,
      latestRun: job.latest_run ? adaptRun(job.latest_run as unknown as RawRun) : null,
    })),
    totals: {
      jobs: raw.totals.jobs,
      failing: raw.totals.failing,
      stale: raw.totals.stale,
      neverRun: raw.totals.never_run,
      runs24h: raw.totals.runs_24h,
      errors24h: raw.totals.errors_24h,
      skipped24h: raw.totals.skipped_24h,
      succeeded24h: raw.totals.succeeded_24h,
    },
  };
}

export function adaptRunPage(raw: {
  runs: RawRun[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}): RunPage {
  return {
    runs: raw.runs.map(adaptRun),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    pages: raw.pages,
  };
}

/**
 * Where a run's AI trace lives.
 *
 * SPEC-228 shipped this as `/ai/traces?trace=<id>` — a route that does not exist.
 * The only traces route is `/ai/traces/[traceId]`, so every one of those links
 * 404'd; it was never caught because no job had produced a trace yet. Owned here
 * rather than typed into JSX so a test covers it.
 */
export function aiTraceHref(traceId: string): string {
  return `/ai/traces/${encodeURIComponent(traceId)}`;
}

// ── Presentation ─────────────────────────────────────────────────────────────

export interface Tone {
  label: string;
  /** Semantic token classes only — brand red is identity, never status (Rule 9). */
  chip: string;
  dot: string;
}

const HEALTH_TONES: Record<JobHealth, Tone> = {
  failing: {
    label: "Failing",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  // Destructive, deliberately: a job that has never run cannot fail, so if this read
  // as merely "unknown" it would look exactly like a healthy one.
  never_run: {
    label: "Never run",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  stale: {
    label: "Overdue",
    chip: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  running: {
    label: "Running",
    chip: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  ok: {
    label: "Healthy",
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  // Muted, not red: ads and social are off until configured, and a permanent false
  // alarm is how a page teaches its reader to ignore every alarm on it.
  idle: {
    label: "Not configured",
    chip: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};

export function healthTone(health: JobHealth): Tone {
  return HEALTH_TONES[health] ?? HEALTH_TONES.idle;
}

const STATUS_TONES: Record<RunStatus, Tone> = {
  error: {
    label: "Failed",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  success: {
    label: "Succeeded",
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  // Skipped is not a failure: the heavy-job gate skips on purpose, and colouring that
  // red would cry wolf every fifteen minutes.
  skipped: {
    label: "Skipped",
    chip: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  running: {
    label: "Running",
    chip: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
};

export function statusTone(status: RunStatus): Tone {
  return STATUS_TONES[status] ?? STATUS_TONES.skipped;
}

/** `8100` → `8.1s`. Sub-second stays in ms; a job that took 90ms did not take "0.1s". */
export function formatDuration(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${rest}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** `{ reports: 3, locations: 7 }` → `3 reports · 7 locations`. */
export function formatOutcome(outcome: Record<string, number | string> | null): string {
  if (!outcome) return "";
  const parts = Object.entries(outcome).map(([key, value]) => {
    const label = key.replace(/_/g, " ");
    // Singularise when there is exactly one, so a card never reads "1 reports".
    const singular = value === 1 && label.endsWith("s") ? label.slice(0, -1) : label;
    return `${value} ${singular}`;
  });
  return parts.join(" · ");
}

/** Coarse and honest: "2h ago" is what an operator wants at a glance. */
export function relativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const seconds = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

/**
 * Group jobs by purpose, preserving the backend's worst-first order within each
 * group — and ordering the groups themselves by the worst job each contains, so the
 * section holding a failure is never below one that is entirely healthy.
 */
/** The order groups appear in when nothing separates them by severity — roughly the
 * order a person cares about them in. Without this, a tie (every group holding a
 * never-run job, say) resolves by insertion order and Housekeeping leads the page. */
const GROUP_ORDER = ["Data", "Reporting", "Foresight", "Growth", "Money", "Housekeeping"];

export function groupJobs(jobs: SystemJob[]): Array<{ group: string; jobs: SystemJob[] }> {
  const severity: Record<JobHealth, number> = {
    failing: 0,
    never_run: 1,
    stale: 2,
    running: 3,
    ok: 4,
    idle: 5,
  };
  const groups = new Map<string, SystemJob[]>();
  for (const job of jobs) {
    const bucket = groups.get(job.group) ?? [];
    bucket.push(job);
    groups.set(job.group, bucket);
  }
  const worst = (items: SystemJob[]) =>
    Math.min(...items.map((job) => severity[job.health] ?? 9));
  const declared = (group: string) => {
    const index = GROUP_ORDER.indexOf(group);
    return index === -1 ? GROUP_ORDER.length : index;
  };
  return [...groups.entries()]
    .map(([group, items]) => ({ group, jobs: items }))
    .sort(
      (a, b) =>
        worst(a.jobs) - worst(b.jobs) || declared(a.group) - declared(b.group),
    );
}

/** The one-line verdict above the grid. Zero problems is a real answer, not an empty state. */
export function headlineVerdict(totals: SystemTotals): string {
  const problems = totals.failing + totals.neverRun;
  if (problems === 0 && totals.stale === 0) {
    return `All ${totals.jobs} scheduled jobs are running on time.`;
  }
  const parts: string[] = [];
  if (totals.failing) parts.push(`${totals.failing} failing`);
  if (totals.neverRun) parts.push(`${totals.neverRun} never run`);
  if (totals.stale) parts.push(`${totals.stale} overdue`);
  return `${parts.join(", ")} of ${totals.jobs} scheduled jobs.`;
}
