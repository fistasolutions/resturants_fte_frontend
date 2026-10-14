"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Clock, LoaderCircle, RefreshCw, Snowflake, Tag, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { dashArray } from "@/lib/recovery-ring";
import type {
  DeadStockAged,
  DeadStockAgedTopItem,
  DeadStockPlan,
  DeadStockRecommendation,
  DeadStockUrgency,
} from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

// ── AI plan fetch ─────────────────────────────────────────────────────────────

async function fetchPlan(refresh = false): Promise<DeadStockPlan> {
  const res = await fetch(
    `/api/proxy/analysis/inventory/dead-stock-plan${refresh ? "?refresh=true" : ""}`,
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "Could not load markdown plan.");
  }
  return body as DeadStockPlan;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutesAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

function discountColor(pct: number): string {
  if (pct >= 50) return "bg-destructive/15 text-destructive border-destructive/25";
  if (pct >= 35) return "bg-warning/15 text-warning border-warning/25";
  return "bg-primary/10 text-primary border-primary/25";
}

/** Just the text-color token for a discount depth (used for big numbers). */
function toneText(pct: number): string {
  if (pct >= 50) return "text-destructive";
  if (pct >= 35) return "text-warning";
  return "text-primary";
}

/** Soft border+tint for a ladder rung, ramping with discount depth. */
function toneSoft(pct: number): string {
  if (pct >= 50) return "border-destructive/25 bg-destructive/[0.05]";
  if (pct >= 35) return "border-warning/25 bg-warning/[0.05]";
  return "border-border bg-card";
}

const URGENCY: Record<DeadStockUrgency, { label: string; cls: string }> = {
  clear_now: {
    label: "Clear now",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  high: { label: "High urgency", cls: "bg-warning/10 text-warning border-warning/20" },
  moderate: { label: "Moderate", cls: "bg-muted text-muted-foreground border-border" },
};

// ── Header stats strip ────────────────────────────────────────────────────────

function HeaderStats({
  data,
  totalRecovery,
}: {
  data: DeadStockAged;
  totalRecovery?: number;
}) {
  const b = data.buckets;
  const frozen = b.d90_180.stock_value + b.d180_plus.stock_value;
  const products = b.d90_180.products + b.d180_plus.products;
  const agedShare = frozen > 0 ? (b.d180_plus.stock_value / frozen) * 100 : 0;

  return (
    <Card className="gap-4 px-5 py-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Cash frozen" value={formatCurrency(frozen)} tone="warning" />
        <Stat label="Dead-stock styles" value={formatNumber(products)} />
        <Stat
          label="180+ days"
          value={formatCurrency(b.d180_plus.stock_value)}
          hint={`${formatNumber(b.d180_plus.products)} styles`}
          tone="destructive"
        />
        <Stat
          label="Projected recovery"
          value={totalRecovery != null ? formatCurrency(totalRecovery) : "—"}
          hint={totalRecovery != null ? "at recommended markdowns" : "generating…"}
        />
      </div>

      {/* Aging split bar: 90–180d vs 180d+ by frozen value */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          <span>Aging of frozen cash</span>
          <span>{Math.round(agedShare)}% is 180+ days</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div className="bg-warning/70" style={{ width: `${100 - agedShare}%` }} aria-hidden />
          <div className="bg-destructive/70" style={{ width: `${agedShare}%` }} aria-hidden />
        </div>
        <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-warning/70" aria-hidden />
            90–180d · {formatCurrency(b.d90_180.stock_value)}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-destructive/70" aria-hidden />
            180d+ · {formatCurrency(b.d180_plus.stock_value)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneCls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-xl font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Product list item ─────────────────────────────────────────────────────────

function ProductListItem({
  item,
  selected,
  recommendation,
  onSelect,
}: {
  item: DeadStockAgedTopItem;
  selected: boolean;
  recommendation?: DeadStockRecommendation;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-primary/40 bg-primary/[0.05]"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="block truncate text-sm font-medium text-foreground"
          title={item.title}
        >
          {item.title}
        </span>
        {recommendation && (
          <span
            className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${discountColor(recommendation.recommended_discount_pct)}`}
          >
            -{recommendation.recommended_discount_pct}%
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatNumber(item.stock)} units</span>
        <span>·</span>
        <span>{formatCurrency(item.stock_value)} frozen</span>
        {item.days_since_last_sale != null && (
          <>
            <span>·</span>
            <span>{item.days_since_last_sale}d idle</span>
          </>
        )}
      </div>
    </button>
  );
}

// ── Recovery ring (radial gauge) ────────────────────────────────────────────

/** Radial recovery gauge (SPEC-100): a `--success` arc over a muted track, with
 * the recovered % in the center. Pure inline SVG, tokens only, no chart lib. */
function RecoveryRing({ pct }: { pct: number }) {
  const r = 34;
  return (
    <div className="relative flex size-24 shrink-0 items-center justify-center">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={dashArray(pct, r)}
          className="stroke-success transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-foreground">
          {Math.round(pct)}%
        </span>
        <span className="text-[8px] font-semibold tracking-widest text-muted-foreground uppercase">
          recovered
        </span>
      </div>
    </div>
  );
}

// ── Discount ladder (cost-of-waiting timeline) ───────────────────────────────

function DiscountLadder({ rec }: { rec: DeadStockRecommendation }) {
  const ladder = rec.discount_ladder ?? [];
  if (ladder.length === 0) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        <TrendingDown className="size-3.5" aria-hidden />
        Markdown ladder — the cost of waiting
      </p>
      <div className="flex items-stretch gap-1.5">
        {ladder.map((tier, i) => (
          <div key={tier.label} className="flex flex-1 items-stretch gap-1.5">
            <div className={`flex-1 rounded-xl border px-3 py-2.5 ${toneSoft(tier.discount_pct)}`}>
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {tier.label}
              </p>
              <p className={`text-2xl font-bold tabular-nums ${toneText(tier.discount_pct)}`}>
                -{tier.discount_pct}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatCurrency(tier.projected_recovery)} back
              </p>
            </div>
            {i < ladder.length - 1 && (
              <ArrowRight
                className="my-auto size-4 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recommendation detail panel ───────────────────────────────────────────────

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function RecommendationPanel({
  item,
  rec,
}: {
  item: DeadStockAgedTopItem;
  rec: DeadStockRecommendation;
}) {
  const recoverPct = Math.min(
    100,
    Math.max(0, Math.round((rec.projected_recovery / item.stock_value) * 100)),
  );
  const urgency = rec.urgency ? URGENCY[rec.urgency] : null;

  return (
    <div className="space-y-4">
      {/* Title + urgency + meta chips */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h2>
          {urgency && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgency.cls}`}
            >
              {urgency.label}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <MetaChip>{formatNumber(item.stock)} units</MetaChip>
          <MetaChip>{formatCurrency(item.stock_value)} frozen</MetaChip>
          {item.days_since_last_sale != null && (
            <MetaChip>
              <Clock className="size-3" aria-hidden />
              {item.days_since_last_sale}d idle
            </MetaChip>
          )}
        </div>
      </div>

      {/* Rationale — accented callout */}
      {rec.rationale && (
        <div className="rounded-r-lg border-l-2 border-ai bg-ai/[0.04] px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">{rec.rationale}</p>
        </div>
      )}

      {/* Hero metrics: discount + recovery ring */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/60 to-card px-4 py-4">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Recommended discount
          </p>
          <p className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${toneText(rec.recommended_discount_pct)}`}>
            -{rec.recommended_discount_pct}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">start here — act while demand lasts</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-success/25 bg-success/[0.05] px-4 py-4">
          <RecoveryRing pct={recoverPct} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Projected recovery
            </p>
            <p className="mt-0.5 truncate text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(rec.projected_recovery)}
            </p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(item.stock_value)} frozen</p>
          </div>
        </div>
      </div>

      {/* Discount ladder */}
      <DiscountLadder rec={rec} />

      {/* Action */}
      <div className="flex items-center gap-3 rounded-2xl border border-ai/25 bg-gradient-to-br from-ai/[0.08] to-card px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai">
          <Tag className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Recommended action
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{rec.action}</p>
        </div>
      </div>
    </div>
  );
}

function NoRecommendationPanel({ item }: { item: DeadStockAgedTopItem }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
      <p className="text-sm text-muted-foreground">
        This product wasn&apos;t included in the AI plan — it may have been outside the
        top items by stock value. Try refreshing the plan to include more products.
      </p>
    </div>
  );
}

/** Skeleton that mirrors the real detail layout (SPEC-092) — rationale line, two
 * metric cards, a 3-rung ladder, and an action row — so a cold generation reads
 * as intentional, not broken. */
function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MarkdownPlanPageProps {
  initialData: DeadStockAged | null;
  /** Server-fetched stored plan (SPEC-092) — present → renders instantly, no
   * skeleton; null → the client generates once on mount. */
  initialPlan?: DeadStockPlan | null;
}

export function MarkdownPlanPage({ initialData, initialPlan = null }: MarkdownPlanPageProps) {
  const items = initialData?.top_by_value ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(items[0]?.product_id ?? null);
  const [plan, setPlan] = useState<DeadStockPlan | null>(initialPlan);
  // Only "loading" when there's nothing to show yet — a server-provided plan
  // renders immediately (the whole point of SPEC-092).
  const [loading, setLoading] = useState(initialPlan == null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cached plan already server-rendered → don't fetch/regenerate on visit.
    // (When we do reach here, `loading` already initialized to true and `error`
    // to null, so no synchronous setState in the effect body is needed.)
    if (initialPlan != null) return;
    let cancelled = false;
    fetchPlan()
      .then((p) => { if (!cancelled) setPlan(p); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initialPlan]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setPlan(await fetchPlan(true));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="flex items-center gap-3 px-4 py-6">
        <Snowflake className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No dead stock products found (90+ days unsold). Check back after more data
          accumulates.
        </p>
      </Card>
    );
  }

  const selectedItem = items.find((i) => i.product_id === selectedId) ?? items[0];
  const selectedRec = plan?.recommendations.find(
    (r) => r.product_id === selectedItem.product_id,
  );

  return (
    <div className="space-y-4">
      {initialData && <HeaderStats data={initialData} totalRecovery={plan?.total_projected_recovery} />}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left — product list (independently scrollable, sticky on desktop) */}
        <div className="lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Dead stock products
            </p>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {formatNumber(items.length)}
            </span>
          </div>
          <div className="max-h-[calc(100vh-13rem)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {items.map((item) => (
              <ProductListItem
                key={item.product_id}
                item={item}
                selected={item.product_id === selectedItem.product_id}
                recommendation={plan?.recommendations.find(
                  (r) => r.product_id === item.product_id,
                )}
                onSelect={() => setSelectedId(item.product_id)}
              />
            ))}
          </div>
        </div>

        {/* Right — AI recommendation detail (premium card) */}
        <Card className="relative gap-0 overflow-hidden p-0">
          {/* Gradient hero header */}
          <div className="border-b border-border bg-gradient-to-br from-ai/10 via-card to-card px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai/15 text-ai">
                <GlispIcon className="size-4" aria-hidden />
              </span>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                AI markdown recommendation
              </p>
              {plan && (
                <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                  Generated {minutesAgo(plan.generated_at)}
                  {plan.stale ? " (stale)" : ""}
                </Badge>
              )}
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                aria-label="Regenerate markdown plan"
                className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
              </button>
            </div>
            {plan?.headline && !loading && (
              <p className="mt-3 text-base font-semibold tracking-tight text-foreground">
                {plan.headline}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-4 px-5 py-5">
            {loading && !plan ? (
              <DetailSkeleton />
            ) : error ? (
              <p role="alert" className="text-sm text-muted-foreground">
                {error}
              </p>
            ) : selectedRec ? (
              <RecommendationPanel item={selectedItem} rec={selectedRec} />
            ) : plan ? (
              <NoRecommendationPanel item={selectedItem} />
            ) : null}

            {/* Total projected recovery */}
            {plan && !loading && (
              <div className="mt-auto border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Total projected recovery across all recommendations:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(plan.total_projected_recovery)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
