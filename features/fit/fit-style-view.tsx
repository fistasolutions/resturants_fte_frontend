"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FitStyleSkeleton } from "@/features/fit/fit-skeleton";
import {
  ConfidenceText,
  LeanBar,
  NUM,
  StyleThumb,
  TD,
  TH,
  Tile,
  VerdictBadge,
} from "@/features/fit/fit-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { isNotFound } from "@/lib/api-error";
import { FIT_ROOT, VERDICT_META, coverageLabel, guideText } from "@/lib/fit";
import { fitQueries } from "@/lib/queries/fit";
import { cn } from "@/lib/utils";
import type { FitStyleDetail } from "@/types/fit";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

/** One style's fit (SPEC-306), read from the client cache; a style with no returns is
 * the backend's 404, shown as a recoverable error rather than an empty page. */
export function FitStyleView({ productId }: { productId: number }) {
  const query = useApiQuery(fitQueries.style(productId));
  const hydrated = useHydrated();
  if (query.isError) {
    if (isNotFound(query.error)) return <NoReturns message={query.error.message} />;
    return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (!query.data || !hydrated) return <FitStyleSkeleton />;
  return <FitStylePage detail={query.data} />;
}

/** A style with no returns on record: say so plainly and lead back — not an error page. */
function NoReturns({ message }: { message: string }) {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/products" className="transition-colors hover:text-foreground">
          Product Analyst
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={FIT_ROOT} className="transition-colors hover:text-foreground">
          Fit
        </Link>
      </nav>
      <Card className="items-center gap-2 px-6 py-12 text-center">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">A style appears here once a customer returns it.</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href={FIT_ROOT}>Back to Fit</Link>
        </Button>
      </Card>
    </main>
  );
}

function pct(value: number | null): string {
  return value === null ? "—" : formatPercent(value * 100);
}

function FitStylePage({ detail }: { detail: FitStyleDetail }) {
  const [copied, setCopied] = useState(false);
  const meta = VERDICT_META[detail.verdict];
  const multiple =
    detail.fitRate !== null && detail.storeFitRate ? detail.fitRate / detail.storeFitRate : null;
  const exchanged = detail.exchangesUp + detail.exchangesDown;

  async function copy() {
    try {
      await navigator.clipboard.writeText(guideText(detail));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/products" className="transition-colors hover:text-foreground">
          Product Analyst
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={FIT_ROOT} className="transition-colors hover:text-foreground">
          Fit
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate font-medium text-foreground" aria-current="page">
          {detail.title}
        </span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <StyleThumb src={detail.imageUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl leading-tight">{detail.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {detail.vendor ?? "No vendor"}
            <VerdictBadge verdict={detail.verdict} />
            <ConfidenceText confidence={detail.confidence} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link prefetch={false} href={`/products/${detail.productId}`}>
              Product page
            </Link>
          </Button>
          <Button size="sm" onClick={() => void copy()} disabled={detail.verdict === "not_enough"}>
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy guide"}
          </Button>
        </div>
      </div>

      <Card className="gap-2 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Size guide</p>
        <p className="text-lg font-semibold">{detail.guide.headline}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{detail.guide.reason}</p>
        {detail.guide.sizes.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-2">
            {detail.guide.sizes.map((row) => (
              <li key={row.size} className="rounded-lg border border-border px-2.5 py-1 text-sm">
                <span className="font-semibold">{row.size}</span>
                <span className="text-muted-foreground"> → {row.advice}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          {meta.action}. Copy guide gives this as plain text for the product page — nothing is written to Shopify.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Fit returns"
          value={formatNumber(detail.fitReturns)}
          sub={`${detail.small} too small · ${detail.large} too big`}
        />
        <Tile
          label="Fit rate"
          value={pct(detail.fitRate)}
          sub={multiple === null ? "of units sold" : `${multiple.toFixed(1)}× the store's ${pct(detail.storeFitRate)}`}
          tone={multiple !== null && multiple >= 1.5 ? "bad" : null}
        />
        <Tile
          label="Exchanges"
          value={exchanged ? `${detail.exchangesUp} up · ${detail.exchangesDown} down` : "—"}
          sub={exchanged ? "sizes customers swapped to" : "no size exchanges recorded"}
        />
        <Tile label="Refunded on fit" value={formatCurrency(detail.fitRefund)} sub={`${formatNumber(detail.sold)} sold`} tone="bad" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-baseline gap-x-2 border-b border-border px-3 py-2.5">
          <h2 className="text-sm font-semibold">By size</h2>
          <span className="text-xs text-muted-foreground">
            advice appears only where a size has enough fit returns of its own
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(TH, "text-left")}>Size</th>
                <th className={cn(TH, NUM)}>Sold</th>
                <th className={cn(TH, NUM)}>Too small</th>
                <th className={cn(TH, NUM)}>Too big</th>
                <th className={cn(TH, NUM)}>Fit rate</th>
                <th className={cn(TH, "text-left")}>Lean</th>
                <th className={cn(TH, "text-left")}>Advice</th>
              </tr>
            </thead>
            <tbody>
              {detail.sizes.map((row) => (
                <tr key={row.size} className="border-b border-border last:border-0">
                  <td className={cn(TD, "font-semibold")}>{row.size}</td>
                  <td className={cn(TD, NUM)}>{formatNumber(row.sold)}</td>
                  <td className={cn(TD, NUM, row.small > 0 && "text-warning")}>{row.small}</td>
                  <td className={cn(TD, NUM, row.large > 0 && "text-info")}>{row.large}</td>
                  <td className={cn(TD, NUM)}>{pct(row.fitRate)}</td>
                  <td className={TD}>
                    <LeanBar small={row.small} large={row.large} className="w-32" />
                  </td>
                  <td className={cn(TD, row.advice ? "font-medium" : "text-muted-foreground")}>{row.advice ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {detail.vendorProfile && (
        <Card className="gap-2 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.vendorProfile.vendor} across its styles
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <VerdictBadge verdict={detail.vendorProfile.verdict} />
            <LeanBar small={detail.vendorProfile.small} large={detail.vendorProfile.large} className="w-56" />
            <span className="text-sm text-muted-foreground">
              {detail.vendorProfile.stylesSmall} of {detail.vendorProfile.styles} styles run small ·{" "}
              {detail.vendorProfile.stylesLarge} run large
            </span>
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        From Loop returns {coverageLabel(detail.coverage.start)} — the reason each customer gave and, where they
        exchanged, the size they took instead.
      </p>
    </main>
  );
}
