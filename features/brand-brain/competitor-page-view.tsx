"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Card } from "@/components/ui/card";
import { BrandBrainBreadcrumb } from "@/features/brand-brain/brand-brain-breadcrumb";
import { CompetitorCard } from "@/features/brand-brain/competitor-card";
import { useBrandBrainRefresh } from "@/features/brand-brain/use-brand-brain-refresh";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { factHref } from "@/lib/brand-brain";
import { brandBrainQueries } from "@/lib/queries/brand-brain";

import CompetitorLoading from "@/app/(app)/spotlight/brand-brain/competitors/[id]/loading";

/** One competitor on its own page (SPEC-283): the full card — every axis, every
 * gap topic, every page read — under the site's breadcrumb, with the fact it became. */
export function CompetitorPageView({ id }: { id: number }) {
  const refresh = useBrandBrainRefresh();
  const detail = useApiQuery(brandBrainQueries.competitor(id));
  if (detail.isPending) return <CompetitorLoading />;
  if (detail.isError) {
    if (isNotFound(detail.error)) notFound();
    return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  }
  const c = detail.data;
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 pb-16 md:p-6">
      <BrandBrainBreadcrumb section="competitors" sectionLabel="Competitors" current={c.name} />
      <CompetitorCard competitor={c} full onChanged={refresh} />
      {c.factId ? (
        <Card className="p-4 text-sm">
          This competitor is a fact the writers position against —{" "}
          <Link href={factHref(c.factId)} className="font-semibold text-primary hover:underline">
            open the fact
          </Link>
          .
        </Card>
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">Approve it and it becomes a cited fact in Facts › Competitors that every writer positions against.</Card>
      )}
    </main>
  );
}
