"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { BracketingTab } from "@/features/returns/bracketing-tab";
import { ByStyleTab } from "@/features/returns/by-style-tab";
import { CategoriesTab } from "@/features/returns/categories-tab";
import { FixesTab } from "@/features/returns/fixes-tab";
import { OverviewTab } from "@/features/returns/overview-tab";
import { ReturnsContentSkeleton } from "@/features/returns/returns-content-skeleton";
import type { ReturnsTab } from "@/features/returns/returns-tabs";
import { SizingTab } from "@/features/returns/sizing-tab";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import type { CompareMode } from "@/lib/date-range";
import { returnQueries } from "@/lib/queries/returns";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <RotateCcw className="size-5" aria-hidden />
      </span>
      <h2 className="font-heading text-lg tracking-wide">No returns in this period</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Link
        href="/integrations"
        className="mt-4 text-sm font-medium text-foreground underline underline-offset-4"
      >
        Check the Loop connection in Integrations
      </Link>
    </div>
  );
}

interface ReturnsTabContentProps {
  activeTab: ReturnsTab;
  from: string;
  to: string;
  compare: CompareMode;
  category?: string;
}

/**
 * The active Returns Intelligence tab, read from the client cache (SPEC-230). Each
 * tab observes only the queries it renders; the by-style answer is shared between
 * Overview and By Style so switching between them never refetches it. The empty and
 * failure copy is exactly what the server-rendered page showed.
 */
export function ReturnsTabContent({ activeTab, from, to, compare, category }: ReturnsTabContentProps) {
  const q = { from, to };
  const rangeQuery = new URLSearchParams({ from, to }).toString();

  const overviewQ = useApiQuery(activeTab === "overview" ? returnQueries.overview(q) : null);
  const opsQ = useApiQuery(activeTab === "overview" ? returnQueries.metrics({ from, to, compare }) : null);
  const byStyleQ = useApiQuery(
    activeTab === "overview" || activeTab === "by-style" ? returnQueries.byStyle(q) : null,
  );
  const bySizeQ = useApiQuery(activeTab === "sizing" ? returnQueries.bySize(q) : null);
  const fixesQ = useApiQuery(activeTab === "fixes" ? returnQueries.fixes(q) : null);
  const byCategoryQ = useApiQuery(activeTab === "categories" ? returnQueries.byCategory(q) : null);
  const bracketingQ = useApiQuery(activeTab === "bracketing" ? returnQueries.bracketing(q) : null);
  const hydrated = useHydrated();

  const active = {
    overview: [overviewQ, opsQ, byStyleQ],
    "by-style": [byStyleQ],
    sizing: [bySizeQ],
    fixes: [fixesQ],
    categories: [byCategoryQ],
    bracketing: [bracketingQ],
  }[activeTab];
  if (active.some((query) => query.isPending)) return <ReturnsContentSkeleton />;

  // Bracketing reads Shopify's orders and refunds, not Loop, so it has its own states —
  // and a hydration guard, because its cached answer can land before hydration (SPEC-309).
  if (activeTab === "bracketing") {
    if (bracketingQ.isError) {
      return <QueryErrorState error={bracketingQ.error} onRetry={() => void bracketingQ.refetch()} />;
    }
    if (!hydrated || !bracketingQ.data) return <ReturnsContentSkeleton />;
    return bracketingQ.data.summary.orders > 0 ? (
      <BracketingTab data={bracketingQ.data} />
    ) : (
      <EmptyState message="No orders were placed in this period, so there is nothing to bracket." />
    );
  }
  const failed = active.some((query) => query.isError);

  const overview = overviewQ.data ?? null;
  const ops = opsQ.data?.metrics ?? null;
  const byStyle = byStyleQ.data ?? null;
  const bySize = bySizeQ.data ?? null;
  const fixes = fixesQ.data ?? null;
  const byCategory = byCategoryQ.data ?? null;

  if (failed) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
        We couldn&apos;t load returns intelligence right now. Check that Loop Returns is
        connected in{" "}
        <Link href="/integrations" className="font-medium text-foreground underline">
          Integrations
        </Link>
        , then retry.
      </div>
    );
  }
  if (activeTab === "overview") {
    if (!overview?.has_data || !ops || !byStyle) {
      return (
        <EmptyState message="Once returns land through Loop in this date range, the full breakdown appears here." />
      );
    }
    return (
      <OverviewTab
        overview={overview}
        ops={ops}
        topStyles={byStyle.styles}
        rangeQuery={rangeQuery}
        from={from}
        to={to}
      />
    );
  }
  if (activeTab === "by-style") {
    return byStyle?.has_data ? (
      <ByStyleTab styles={byStyle.styles} rangeQuery={rangeQuery} category={category} />
    ) : (
      <EmptyState message="No styles were returned in this period." />
    );
  }
  if (activeTab === "sizing") {
    return bySize?.has_data ? (
      <SizingTab
        styles={bySize.styles}
        sizeProfile={bySize.size_profile}
        rangeQuery={rangeQuery}
      />
    ) : (
      <EmptyState message="No returns to analyze for sizing in this period." />
    );
  }
  if (activeTab === "fixes") {
    return fixes && fixes.summary.returnsWithReason > 0 ? (
      <FixesTab data={fixes} />
    ) : (
      <EmptyState message="No returns carried a reason in this period — reasons come from Loop." />
    );
  }
  return byCategory?.has_data ? (
    <CategoriesTab categories={byCategory.categories} rangeQuery={rangeQuery} />
  ) : (
    <EmptyState message="No category returns in this period." />
  );
}
