/**
 * Switch a digital employee on or off (SPEC-359 over backend SPEC-367) — client-side, through
 * the proxy. The caller then refreshes the layout so the sidebar, the access gate and the setup
 * checklist follow.
 */
import { proxyUrl } from "@/lib/client-api";
import type { EmployeeState } from "@/lib/guided-view";

/** The store's employees after the change; the setup checklist is the workspace's (SPEC-360). */
export interface EmployeeSwitchResult {
  employees: EmployeeState[];
}

export class EmployeeSwitchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EmployeeSwitchError";
  }
}

export async function setEmployeeActive(key: string, active: boolean): Promise<EmployeeSwitchResult> {
  const response = await fetch(proxyUrl(`/employees/${encodeURIComponent(key)}/active`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new EmployeeSwitchError(
      body?.error?.message ?? `Couldn't change the employee (${response.status}).`,
      response.status,
    );
  }
  return (await response.json()) as EmployeeSwitchResult;
}
