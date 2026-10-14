import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { EmployeesView } from "@/features/employees/employees-view";
import { employeesQueries } from "@/lib/queries/employees";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Digital Employees" };
export const dynamic = "force-dynamic";

/** Content only — the header lives in the persistent shell (SPEC-232); the roster
 * streams into the client cache (SPEC-230). */
export default function EmployeesPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, employeesQueries.roster());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeesView />
    </HydrationBoundary>
  );
}
