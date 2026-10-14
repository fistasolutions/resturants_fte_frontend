"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodPicker } from "@/features/ai/period-picker";
import { isAiShellRoute } from "@/lib/ai-tabs";
import { PERIODS } from "@/lib/ai-value";
import type { AiValuePeriod } from "@/types/ai-value";

const DESCRIPTION = "What the agents did, how well they did it, and what it cost.";

function periodFrom(value: string | null): AiValuePeriod {
  return PERIODS.some((option) => option.key === value)
    ? (value as AiValuePeriod)
    : "all";
}

/**
 * Persistent shell for AI Performance (SPEC-229): the header and the period picker
 * stay mounted, so switching period no longer rebuilds the title and description
 * along with the data.
 *
 * The picker reads its own value from the URL rather than being handed one by the
 * page — the page is a Server Component that re-renders on every period change, and
 * threading the value up through a layout would mean re-rendering the chrome for the
 * one thing it does not need to know.
 *
 * Non-shell routes render bare: a trace has its own title, and a period means nothing
 * on a single run.
 */
export function AiShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!isAiShellRoute(pathname)) return <>{children}</>;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="AI Performance" description={DESCRIPTION} />
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker active={periodFrom(searchParams.get("period"))} />
          <Link
            href="/system"
            className="inline-flex h-9 items-center rounded-[10px] border border-border px-3 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            System
          </Link>
        </div>
      </div>
      {children}
    </main>
  );
}
