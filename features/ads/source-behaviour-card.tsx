import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campaignSources, mergedFrom, sourceVerdict } from "@/lib/clarity";
import type { ClarityCampaigns } from "@/types/clarity";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * What happens between the click and the order (backend SPEC-219).
 *
 * The Ads page already knows what each source cost and what it earned. What it has
 * never known is what people *did* in between — and that is the difference between two
 * situations a spend dashboard renders identically:
 *
 *   0 orders + people read the whole page   → the page is broken, keep the traffic
 *   0 orders + people leave in 12 seconds   → the audience is wrong, cut the traffic
 *
 * Pause the first one and you have thrown away good traffic to avoid fixing a bug.
 * Rendered as prose per source, because the verdict is the product, not the numbers.
 */
export function SourceBehaviourCard({ data }: { data: ClarityCampaigns }) {
  // The store's own website and direct visits are not campaigns (SPEC-284 patch).
  const sources = campaignSources(data.sources);
  if (!data.connected || sources.length === 0) return null;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Between the click and the order</CardTitle>
        <p className="text-sm text-muted-foreground">
          Behaviour from Clarity against orders attributed in your own data — enough to
          tell bad traffic apart from good traffic landing on a bad page. Facebook and Instagram count as one
          channel, Meta; Klaviyo and mail apps count as Email.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.source}
            className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-card border border-border p-3"
          >
            <span className="min-w-24 text-sm font-medium text-foreground">
              {source.label}
              {mergedFrom(source) && (
                <span className="block text-[11px] font-normal text-muted-foreground">{mergedFrom(source)}</span>
              )}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatNumber(source.sessions)} sessions ·{" "}
              {Math.round(source.avgScrollDepth * 100)}% scroll
            </span>
            <span className="text-xs tabular-nums text-foreground">
              {formatNumber(source.attributedOrders)} orders ·{" "}
              {formatCurrency(source.attributedRevenue)}
            </span>
            <span className="flex-1 text-xs text-muted-foreground">
              {sourceVerdict(source)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
