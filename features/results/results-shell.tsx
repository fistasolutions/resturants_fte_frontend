"use client";

import { PageHeader } from "@/components/shared/page-header";

/**
 * Persistent Results shell (SPEC-232). The tab bar stays in the view: its labels
 * carry data-derived counts, and a count that must wait for data cannot be painted
 * before it. The header can, so it moves here.
 */
export function ResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Results"
        description="Every message the platform ever sent on your behalf, and whether it actually worked."
      />
      {children}
    </main>
  );
}
