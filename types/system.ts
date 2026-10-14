/** System traces — scheduler job health and run history (SPEC-228 / backend SPEC-238). */

export type JobHealth =
  | "ok"
  | "failing"
  | "stale"
  | "running"
  | "never_run"
  | "idle";

export type RunStatus = "running" | "success" | "error" | "skipped";

export interface JobRun {
  id: number;
  jobId: string;
  title?: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  /** What the run produced — `{ reports: 3 }`. Absent for jobs that report nothing. */
  outcome: Record<string, number | string> | null;
  /** Why it was skipped, or a one-line note beside the status. */
  detail: string | null;
  /** The message only — the API never returns a stack (root Rule 6). */
  error: string | null;
  /** Present only where the job ran an agent; links out to `/ai/traces`. */
  traceId: string | null;
}

export interface SystemJob {
  key: string;
  title: string;
  purpose: string;
  group: string;
  cadenceLabel: string;
  cadenceMinutes: number;
  /** False for jobs that stay silent until configured — their silence is not a fault. */
  expected: boolean;
  health: JobHealth;
  lastSuccessAt: string | null;
  latestRun: JobRun | null;
}

export interface SystemTotals {
  jobs: number;
  failing: number;
  stale: number;
  neverRun: number;
  runs24h: number;
  errors24h: number;
  skipped24h: number;
  succeeded24h: number;
}

export interface SystemOverview {
  generatedAt: string;
  jobs: SystemJob[];
  totals: SystemTotals;
}

export interface RunPage {
  runs: JobRun[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface RunDetail extends JobRun {
  title: string;
  purpose: string | null;
  cadenceLabel: string | null;
  group: string | null;
}
