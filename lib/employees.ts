/**
 * Digital Employees logic (SPEC-290).
 *
 * The pure half of the hub: the API adapter, the status → tone map, figure
 * formatting and the two derived lines (team line, last-thing-it-did line). Kept out
 * of the components so Vitest can prove it; the backend decides every status and
 * every number (SPEC-285), this file only says how they look.
 */

import type { StatusTone } from "@/components/shared/status-badge";
import { relativeTime } from "@/lib/system-trace";
import type {
  Employee,
  EmployeeFigure,
  EmployeeStatus,
  EmployeesRoster,
  EmployeesTotals,
} from "@/types/employees";
import { formatCurrency, formatNumber } from "@/utils/format";

// ── Adapter — snake_case API → camelCase view model ─────────────────────────

interface RawFigure {
  key: string;
  label: string;
  value: number | null;
  kind: "count" | "money";
}

interface RawEmployee {
  key: Employee["key"];
  name: string;
  monogram: string;
  role: string;
  department: string;
  job: string;
  href: string;
  status: EmployeeStatus;
  status_label: string;
  status_note: string;
  needs_you: { count: number; label: string; href: string } | null;
  figures: RawFigure[];
  last_activity: { text: string; at: string | null } | null;
  last_run: {
    job: string;
    title: string;
    health: string;
    at: string | null;
    cadence_label: string | null;
  } | null;
  setup: { label: string; href: string } | null;
}

export interface RawRoster {
  generated_at: string;
  employees: RawEmployee[];
  totals: { needs_you: number; attention: number; working: number; not_started: number };
}

function adaptEmployee(raw: RawEmployee): Employee {
  return {
    key: raw.key,
    name: raw.name,
    monogram: raw.monogram,
    role: raw.role,
    department: raw.department,
    job: raw.job,
    href: raw.href,
    status: raw.status,
    statusLabel: raw.status_label,
    statusNote: raw.status_note,
    needsYou: raw.needs_you
      ? { count: raw.needs_you.count, label: raw.needs_you.label, href: raw.needs_you.href }
      : null,
    figures: raw.figures.map((figure) => ({
      key: figure.key,
      label: figure.label,
      value: figure.value,
      kind: figure.kind,
    })),
    lastActivity: raw.last_activity
      ? { text: raw.last_activity.text, at: raw.last_activity.at }
      : null,
    lastRun: raw.last_run
      ? {
          job: raw.last_run.job,
          title: raw.last_run.title,
          health: raw.last_run.health,
          at: raw.last_run.at,
          cadenceLabel: raw.last_run.cadence_label,
        }
      : null,
    setup: raw.setup ? { label: raw.setup.label, href: raw.setup.href } : null,
  };
}

export function adaptRoster(raw: RawRoster): EmployeesRoster {
  return {
    generatedAt: raw.generated_at,
    employees: raw.employees.map(adaptEmployee),
    totals: {
      needsYou: raw.totals.needs_you,
      attention: raw.totals.attention,
      working: raw.totals.working,
      notStarted: raw.totals.not_started,
    },
  };
}

// ── Presentation decisions ───────────────────────────────────────────────────

const STATUS_TONE: Record<EmployeeStatus, StatusTone> = {
  working: "success",
  needs_you: "warning",
  attention: "destructive",
  idle: "neutral",
  not_started: "info",
  unread: "neutral",
};

/** The chip tone for a status. The backend owns the status itself (SPEC-285). */
export function statusTone(status: EmployeeStatus): StatusTone {
  return STATUS_TONE[status];
}

/** A figure's text: counts and money by the app's formatters; an unset value says so,
 * and a figure that could not be read at all (status `unread`) is a dash. */
export function figureText(figure: EmployeeFigure, status?: EmployeeStatus): string {
  if (figure.value === null) return status === "unread" ? "—" : "Not set";
  return figure.kind === "money" ? formatCurrency(figure.value) : formatNumber(figure.value);
}

/** The one line above the grid — only the parts that are non-zero. */
export function teamLine(totals: EmployeesTotals, count: number): string {
  const parts = [`${count} digital ${count === 1 ? "employee" : "employees"}`];
  if (totals.needsYou > 0) {
    parts.push(`${formatNumber(totals.needsYou)} ${totals.needsYou === 1 ? "item needs" : "items need"} you`);
  }
  if (totals.attention > 0) {
    parts.push(`${totals.attention} ${totals.attention === 1 ? "needs" : "need"} attention`);
  }
  if (totals.notStarted > 0) parts.push(`${totals.notStarted} not started`);
  if (parts.length === 1) parts.push("all on shift");
  return parts.join(" · ");
}

/**
 * The card's footer: the last thing the employee did, or — when its domain has no
 * one-row event — its last scheduled run. Relative times are computed here, never by
 * the backend (SPEC-285).
 */
export function lastLine(employee: Employee, now: Date = new Date()): string | null {
  if (employee.lastActivity) {
    const when = employee.lastActivity.at ? ` · ${relativeTime(employee.lastActivity.at, now)}` : "";
    return `${employee.lastActivity.text}${when}`;
  }
  if (employee.lastRun) {
    return `${employee.lastRun.title} · ${employee.lastRun.health.replace("_", " ")} · ${relativeTime(employee.lastRun.at, now)}`;
  }
  return null;
}
