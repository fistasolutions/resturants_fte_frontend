import { cn } from "@/lib/utils";
import { seoTone, seoToneLabel } from "@/lib/spotlight";

const TEXT_TONE = {
  strong: "text-success",
  fair: "text-warning",
  weak: "text-destructive",
} as const;

const BAR_TONE = {
  strong: "bg-success",
  fair: "bg-warning",
  weak: "bg-destructive",
} as const;

const HINT = {
  strong: "Ready to publish — strong on-page signals.",
  fair: "Publishable, with room to strengthen headings & links.",
  weak: "Needs work before it will rank.",
} as const;

/** SEO-readiness gauge (SPEC-109): a big score + a tone-colored bar and hint.
 * Status tokens only. Shared by Approvals and the blog detail (backend
 * SPEC-109 wiring). */
export function SeoGauge({ score }: { score: number }) {
  const tone = seoTone(score);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-col">
        <span
          className={cn(
            "font-heading text-3xl tracking-wide tabular-nums",
            TEXT_TONE[tone],
          )}
        >
          {score}
        </span>
        <span className="text-[0.6875rem] text-muted-foreground">
          SEO · {seoToneLabel(score)}
        </span>
      </div>
      <div className="h-10 w-px bg-border" aria-hidden />
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", BAR_TONE[tone])}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{HINT[tone]}</p>
      </div>
    </div>
  );
}
