/** Digital Employees — server transport (SPEC-290). The path, key and loader live in
 * `lib/queries/employees.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { employeesQueries } from "@/lib/queries/employees";
import type { EmployeesRoster } from "@/types/employees";

export async function getEmployeesRoster(): Promise<EmployeesRoster> {
  return employeesQueries.roster().load(serverApi);
}
