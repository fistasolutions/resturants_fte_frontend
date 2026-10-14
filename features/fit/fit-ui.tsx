import type { ReactNode } from "react";
import Image from "next/image";

import { StatusBadge } from "@/components/shared/status-badge";
import { CONFIDENCE_LABEL, VERDICT_META, leanSplit } from "@/lib/fit";
import { shopifyImageUrl } from "@/lib/spotlight";
import { cn } from "@/lib/utils";
import type { FitConfidence, FitVerdict } from "@/types/fit";

export const TH =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
export const TD = "px-3 py-2.5 text-sm";
export const NUM = "text-right tabular-nums";

export function VerdictBadge({ verdict }: { verdict: FitVerdict }) {
  return <StatusBadge tone={VERDICT_META[verdict].tone}>{VERDICT_META[verdict].label}</StatusBadge>;
}

export function ConfidenceText({ confidence }: { confidence: FitConfidence | null }) {
  if (!confidence) return null;
  return (
    <span className="text-[11px] text-muted-foreground">{CONFIDENCE_LABEL[confidence]} confidence</span>
  );
}

/**
 * How the fit returns split: "too small" on the left in the warning tone, "too big" on
 * the right in the info tone — the same two colours as the verdict badges.
 */
export function LeanBar({ small, large, className }: { small: number; large: number; className?: string }) {
  const split = leanSplit(small, large);
  if (!split) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className={cn("min-w-28", className)}>
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${small} too small, ${large} too big`}
      >
        <span className="h-full bg-warning" style={{ width: `${split.small}%` }} />
        <span className="h-full bg-info" style={{ width: `${split.large}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{small} small</span>
        <span>{large} big</span>
      </div>
    </div>
  );
}

export function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "warn" | "info" | "bad" | null;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          tone === "warn" && "text-warning",
          tone === "info" && "text-info",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** A style's picture, asked of Shopify's CDN at the size it is drawn (the platform's
 * `shopifyImageUrl` convention) — never the full-size original. */
export function StyleThumb({ src, size = 40 }: { src: string | null; size?: 40 | 64 }) {
  const box = size === 64 ? "size-16" : "size-10";
  if (!src) return <span className={cn(box, "shrink-0 rounded-md bg-muted")} aria-hidden />;
  return (
    <span className={cn(box, "relative shrink-0 overflow-hidden rounded-md bg-muted")}>
      <Image
        src={shopifyImageUrl(src, size * 2)}
        alt=""
        aria-hidden
        fill
        unoptimized
        loading="lazy"
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}
