"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { NexusView } from "@/features/tax-reports/nexus-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { planningQueries } from "@/lib/queries/planning";

/** Nexus Watch (SPEC-221), read from the client cache (SPEC-230). The loader resolves
 * null on failure, which `NexusView` renders as its own empty state. */
export function NexusPageView() {
  const nexus = useApiQuery(planningQueries.nexus());
  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/tax-reports" className="transition-colors hover:text-foreground">
          Sales &amp; Tax Reports
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">
          Nexus Watch
        </span>
      </nav>

      <PageHeader
        title="Nexus Watch"
        description="Sales into each state against its economic-nexus registration threshold."
      />

      {nexus.isPending ? <Skeleton className="h-96 rounded-2xl" /> : <NexusView data={nexus.data ?? null} />}
    </main>
  );
}
