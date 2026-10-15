/** Digital Employees — the roster behind `/employees` (SPEC-290, backend SPEC-285). */

/** `unread` — the employee's own tables could not be read this time (backend SPEC-285). */
export type EmployeeStatus = "not_started" | "attention" | "needs_you" | "idle" | "working" | "unread";

/** `email_marketing` (SPEC-345) and `customer_support` (SPEC-346) are appended by the frontend
 * preview until the roster returns them. */
export type EmployeeKey =
  | "spotlight"
  | "social"
  | "ads"
  | "finance"
  | "report-fte"
  | "email_marketing"
  | "customer_support"
  /** SPEC-385: a restaurant brand's own employee (backend SPEC-402). */
  | "ops_coach";

export type FigureKind = "count" | "money";

export interface EmployeeFigure {
  key: string;
  label: string;
  /** `null` is "not configured" (an ads cap that was never set) — never shown as 0. */
  value: number | null;
  kind: FigureKind;
}

export interface EmployeeAction {
  label: string;
  href: string;
}

export interface EmployeeNeedsYou extends EmployeeAction {
  count: number;
}

export interface EmployeeActivity {
  text: string;
  /** ISO timestamp, or null when the event carried no time. */
  at: string | null;
}

export interface EmployeeRun {
  job: string;
  title: string;
  /** SPEC-238's derived health — the UI never recomputes it. */
  health: string;
  at: string | null;
  cadenceLabel: string | null;
}

export interface Employee {
  key: EmployeeKey;
  /** The sidebar title verbatim — the doc is pinned to it (Rule 11). */
  name: string;
  monogram: string;
  role: string;
  department: string;
  job: string;
  href: string;
  status: EmployeeStatus;
  statusLabel: string;
  statusNote: string;
  needsYou: EmployeeNeedsYou | null;
  figures: EmployeeFigure[];
  lastActivity: EmployeeActivity | null;
  lastRun: EmployeeRun | null;
  /** Present only while `status` is `not_started`. */
  setup: EmployeeAction | null;
}

export interface EmployeesTotals {
  needsYou: number;
  attention: number;
  working: number;
  notStarted: number;
}

export interface EmployeesRoster {
  generatedAt: string;
  employees: Employee[];
  totals: EmployeesTotals;
}
