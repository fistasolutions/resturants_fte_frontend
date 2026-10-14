/** Digital Employees queries (SPEC-290, backend SPEC-285) — defined once for both
 * transports (SPEC-230). Byte-identical path to `services/employees.ts`. */
import { adaptRoster, type RawRoster } from "@/lib/employees";
import { defineQuery } from "@/lib/query-def";
import type { EmployeesRoster } from "@/types/employees";

export const employeesPaths = {
  roster: (): string => "/employees",
} as const;

export const employeesQueries = {
  /** One composite read serves the whole hub — the four employees in one round trip. */
  roster: () =>
    // Every employee, the Email Marketing Manager (backend SPEC-354) and the Customer Support
    // Agent (backend SPEC-353) included, comes from the backend's roster.
    defineQuery<EmployeesRoster>(["employees", "roster"], async (api) => adaptRoster(await api<RawRoster>(employeesPaths.roster()))),
} as const;
