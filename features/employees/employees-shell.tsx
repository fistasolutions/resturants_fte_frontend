"use client";

import { usePathname } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";

const DESCRIPTION =
  "Your AI employees as one team — who is working, who needs you, and what each one has produced. Open any of them from here.";

/**
 * Persistent shell for the Digital Employees hub (SPEC-290, in the SPEC-232 shape):
 * the header paints once from the layout and never re-renders with the roster. The
 * hub has no tabs — the employees are the cards.
 *
 * An employee that lives UNDER the hub (`/employees/finance`) owns its own header,
 * breadcrumb and tab bar, so it passes through bare — the same rule every shell uses
 * for its detail routes (SPEC-232).
 */
export function EmployeesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/employees") return <>{children}</>;
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader title="Digital Employees" description={DESCRIPTION} />
      {children}
    </main>
  );
}
