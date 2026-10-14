"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownPlanPage } from "@/features/analysis/markdown-plan-page";
import { useApiQuery } from "@/hooks/use-api-query";
import { analysisQueries } from "@/lib/queries/analysis";

function Header() {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Markdown Plan</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Markdown Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated clearance recommendations for dead stock — select a product to
          see its discount strategy and projected cash recovery.
        </p>
      </div>
    </>
  );
}

/** The AI markdown plan (SPEC-092), read from the client cache (SPEC-230). The aged
 * data and the STORED plan load in parallel; `cacheOnly` never calls the LLM, so a
 * previously-generated plan renders with no skeleton and a cold cache hands null to
 * `MarkdownPlanPage`, which generates once — exactly as before. */
export function MarkdownPlanView({ from, to }: { from: string; to: string }) {
  const aged = useApiQuery(analysisQueries.deadStockAged({ from, to }));
  const plan = useApiQuery(analysisQueries.deadStockPlan(true));

  if (aged.isPending || plan.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Header />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <Header />
      <MarkdownPlanPage initialData={aged.data ?? null} initialPlan={plan.data ?? null} />
    </div>
  );
}
