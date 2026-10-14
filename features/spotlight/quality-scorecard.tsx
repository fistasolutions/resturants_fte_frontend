import { ChevronDown, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  hasFullQualityScores,
  overallQualityScore,
  QUALITY_DIMENSIONS,
  seoTone,
  seoToneLabel,
  type DraftQualityScores,
  type QualityDimensionKey,
  type SeoTone,
} from "@/lib/spotlight";
import type { BlogDraft, BlogSource, CritiqueRound } from "@/types/spotlight";

const TEXT_TONE: Record<SeoTone, string> = {
  strong: "text-success",
  fair: "text-warning",
  weak: "text-destructive",
};

const BAR_TONE: Record<SeoTone, string> = {
  strong: "bg-success",
  fair: "bg-warning",
  weak: "bg-destructive",
};

function scoresFromDraft(draft: BlogDraft): DraftQualityScores {
  return {
    seo: draft.seoScore,
    aeo: draft.aeoScore,
    geo: draft.geoScore,
    quality: draft.qualityScore,
  };
}

/** One dimension's compact bar: label + caption, a tone-colored fill, and the
 * score. A null score (pre-harness draft) renders a neutral dash, no bar. */
function DimBar({
  label,
  caption,
  score,
}: {
  label: string;
  caption: string;
  score: number | null;
}) {
  const tone = score === null ? null : seoTone(score);
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[0.625rem] leading-tight text-muted-foreground">{caption}</p>
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        {tone && (
          <div
            className={cn("h-full rounded-full", BAR_TONE[tone])}
            style={{ width: `${Math.min(100, Math.max(0, score ?? 0))}%` }}
          />
        )}
      </div>
      <span
        className={cn(
          "w-7 shrink-0 text-right text-sm font-semibold tabular-nums",
          tone ? TEXT_TONE[tone] : "text-muted-foreground",
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

/** The Quality scorecard (backend SPEC-121): an overall readout over four
 * tone-colored dials — SEO (search), AEO (answer engines), GEO (generative /
 * LLMs), Quality (brand) — plus a note when the harness revised more than once.
 * Status tokens only; replaces the single SEO gauge on the blog detail. */
export function QualityScorecard({ draft }: { draft: BlogDraft }) {
  const scores = scoresFromDraft(draft);
  const overall = overallQualityScore(scores);
  const tone = seoTone(overall);
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-heading text-3xl leading-none tracking-wide tabular-nums",
              TEXT_TONE[tone],
            )}
          >
            {overall}
          </span>
          <span className="text-xs text-muted-foreground">/ 100 overall</span>
        </div>
        <span className={cn("text-[0.6875rem] font-medium", TEXT_TONE[tone])}>
          {seoToneLabel(overall)}
        </span>
      </div>
      <div className="space-y-2 border-t border-border pt-3">
        {QUALITY_DIMENSIONS.map((dim) => (
          <DimBar
            key={dim.key}
            label={dim.label}
            caption={dim.caption}
            score={scores[dim.key]}
          />
        ))}
      </div>
      {draft.harnessRounds > 1 && (
        <p className="text-[0.6875rem] text-muted-foreground">
          Refined {draft.harnessRounds}× to reach these scores.
        </p>
      )}
    </div>
  );
}

/** "How it was scored" — a collapsible (native details, no JS) with the critic
 * notes for the round the harness KEPT, and how the weakest dimension moved
 * across rounds.
 *
 * It must show the WINNING round, not the last one (SPEC-121 Patch). The harness
 * returns the best round rather than the final one, so a later round can regress
 * and be discarded — and this panel was rendering that discarded round, i.e.
 * explaining a version of the article the reader is not looking at. On one live
 * draft the headline read 93/88/94/87 while this block read 75/98/89/65. */
export function ScoringDisclosure({ critique }: { critique: CritiqueRound[] }) {
  if (critique.length === 0) return null;
  // Fall back to the last round for drafts written before the marker existed.
  const kept =
    critique.find((round) => round.isFinal) ?? critique[critique.length - 1];
  const first = critique[0];
  const rounds = critique.length;
  const delta = kept.min - first.min;
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        How it was scored
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-3 border-t border-border p-3">
        {rounds > 1 && (
          <p className="text-xs text-muted-foreground">
            {/* "rose" was asserted regardless of direction — it read "rose from
                87 to 65" on a draft where it fell. */}
            Across {rounds} rounds the weakest dimension{" "}
            {delta > 0 ? "rose" : delta < 0 ? "fell" : "held"} from {first.min} to{" "}
            {kept.min}.
          </p>
        )}
        <ul className="space-y-2">
          {QUALITY_DIMENSIONS.map((dim) => {
            const key = dim.key as QualityDimensionKey;
            const note = kept.notes[key];
            if (!note) return null;
            return (
              <li key={dim.key} className="text-xs leading-relaxed">
                <span className="font-medium text-foreground">
                  {dim.label} · {kept.scores[key]}
                </span>
                <span className="text-muted-foreground"> — {note}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** "Researched sources" — the off-store citations the article grounded on
 * (backend SPEC-121), each opening in a new tab. Proves the GEO/live-research
 * grounding; renders nothing when the backend supplied no sources. */
export function ResearchedSources({ sources }: { sources: BlogSource[] }) {
  if (sources.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {sources.map((source) => (
        <li key={source.url}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            title={source.url}
          >
            <ExternalLink className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{sourceLabel(source.url)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Whether a draft carries the full four-dimension harness scorecard (vs. only
 * the legacy SEO score) — gates the overall badge on list cards. */
export function hasScorecard(draft: BlogDraft): boolean {
  return hasFullQualityScores(scoresFromDraft(draft));
}

/** The draft's single overall quality number, for a compact list-card badge. */
export function draftOverallScore(draft: BlogDraft): number {
  return overallQualityScore(scoresFromDraft(draft));
}
