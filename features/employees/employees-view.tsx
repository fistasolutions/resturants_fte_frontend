"use client";

import { useRef } from "react";

import EmployeesLoading from "@/app/(app)/employees/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { EmployeeCard } from "@/features/employees/employee-card";
import { useGaze } from "@/features/employees/use-gaze";
import { useApiQuery } from "@/hooks/use-api-query";
import { teamLine } from "@/lib/employees";
import { employeesQueries } from "@/lib/queries/employees";

/** The hub (SPEC-290): one line about the team, then a card per employee, read from
 * the client cache (SPEC-230). Content only — the header is the shell's. The
 * characters on the cards look at the pointer (SPEC-291, `useGaze`). */
export function EmployeesView() {
  const roster = useApiQuery(employeesQueries.roster());
  const grid = useRef<HTMLDivElement>(null);
  useGaze(grid, roster.isSuccess);
  if (roster.isPending) return <EmployeesLoading />;
  if (roster.isError) {
    return <QueryErrorState error={roster.error} onRetry={() => void roster.refetch()} />;
  }
  const { employees, totals } = roster.data;
  const now = new Date();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" role="status">
        {teamLine(totals, employees.length)}
      </p>
      <div ref={grid} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {employees.map((employee) => (
          <EmployeeCard key={employee.key} employee={employee} now={now} />
        ))}
      </div>
    </div>
  );
}
