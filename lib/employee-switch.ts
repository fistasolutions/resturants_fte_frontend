/**
 * The employee switch (SPEC-359) — pure. Which employees a guided store has switched on comes
 * from the workspace's `visibility.employees` (backend SPEC-366/367); this module reads one
 * employee's state. What an employee still needs to connect is the setup checklist's
 * (`lib/setup-checklist.ts`, SPEC-360).
 */
import { pageName } from "@/lib/disclosure";
import { pageKey } from "@/lib/first-sync";
import type { EmployeeState, Visibility } from "@/lib/guided-view";

/** Each employee's own page (the rulebook's `EMPLOYEE_PAGES`, reversed). */
export const EMPLOYEE_HREF: Readonly<Record<string, string>> = {
  spotlight: "/spotlight",
  social: "/social",
  ads: "/ads",
  email_marketing: "/email-marketing",
  customer_support: "/customer-support",
  finance: "/employees/finance",
  "report-fte": "/report-fte",
};

/** The sidebar's name for an employee ("finance" → "Accounts Payable"). */
export function employeeName(key: string): string {
  const href = EMPLOYEE_HREF[key];
  return href ? pageName(pageKey(href)) : key;
}

export interface SwitchState {
  /** Whether a switch is drawn at all: guided organizations only. */
  switchable: boolean;
  active: boolean;
  /** The integration it still needs, when it is on and not ready. */
  missing: string | null;
}

const ALWAYS_ON: SwitchState = { switchable: false, active: true, missing: null };

/** One employee's switch. A full organization (FOC), an unread workspace or an employee the
 * rulebook does not name has no switch and counts as on, exactly as before the guided view. */
export function switchState(visibility: Visibility | null, key: string): SwitchState {
  if (!visibility || visibility.disclosure !== "guided") return ALWAYS_ON;
  const employee: EmployeeState | undefined = visibility.employees.find((e) => e.key === key);
  if (!employee) return ALWAYS_ON;
  return {
    switchable: true,
    active: employee.active,
    missing: employee.active && !employee.ready ? (employee.needs[0] ?? null) : null,
  };
}
