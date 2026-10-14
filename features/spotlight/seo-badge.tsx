import { cn } from "@/lib/utils";
import { seoTone, type SeoTone } from "@/lib/spotlight";

const TONE_CLASS: Record<SeoTone, string> = {
  strong: "bg-success/10 text-success",
  fair: "bg-warning/10 text-warning",
  weak: "bg-destructive/10 text-destructive",
};

const CHIP_BASE =
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium tabular-nums";

/** SEO-readiness score chip (SPEC-109), colored by bucket via status tokens
 * only. Used across Inbound Engine and Approvals. */
export function SeoBadge({ score, className }: { score: number; className?: string }) {
  const tone = seoTone(score);
  return (
    <span
      className={cn(CHIP_BASE, TONE_CLASS[tone], className)}
      title={`SEO readiness ${score}/100`}
    >
      SEO {score}
    </span>
  );
}

/** Overall quality-harness score chip (backend SPEC-121) for list cards where
 * the draft carries the full four-dimension scorecard. Same tone scale as the
 * SEO badge; prefixed "Q" so the two never read as the same number. */
export function QualityScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tone = seoTone(score);
  return (
    <span
      className={cn(CHIP_BASE, TONE_CLASS[tone], className)}
      title={`Overall quality ${score}/100 (SEO · AEO · GEO · Quality)`}
    >
      Q {score}
    </span>
  );
}
