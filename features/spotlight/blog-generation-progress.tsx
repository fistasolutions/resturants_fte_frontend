import { Check, PenLine } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * First-generation progress timeline (SPEC-115 Patches, 2026-08-13). Generation
 * now runs the multi-round quality harness (SPEC-121): it writes, critiques, and
 * REWRITES the article up to 5 rounds. Streaming the token body would show the
 * owner drafts that are about to be discarded, so the generate surface reveals
 * the harness PROGRESS instead — each distinct `{status}` frame is a step in a
 * short vertical timeline ("Researching → Writing → Scoring (SEO/AEO/GEO) →
 * Revising round 2 → Final"). Completed steps carry a checkmark; the current
 * (latest) step pulses. The finished article is revealed on `{draft_id}`.
 *
 * The refine/regenerate loop keeps its live token-by-token typing — one article
 * on screen, nothing discarded — so this timeline is generation-only.
 *
 * CSS-only motion (root Rule 9 — no framer-motion): the active dot uses
 * Tailwind's `animate-pulse` and everything renders in its final position (no
 * entrance animation). Semantic tokens only, holds in both themes; the pulse
 * degrades to a static dot under `prefers-reduced-motion`.
 */
export function BlogGenerationProgress({ phases }: { phases: string[] }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-ai">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai/10">
          <PenLine className="size-4 animate-pulse" aria-hidden />
        </span>
        <span className="text-sm font-medium">Designing your article…</span>
      </div>

      <ol
        className="space-y-3"
        aria-label="Writing progress"
        role="status"
        aria-live="polite"
      >
        {phases.map((phase, i) => {
          // The latest accumulated phrase is the phase in progress; every
          // earlier phrase is done. Append-only list → index identity is stable.
          const isCurrent = i === phases.length - 1;
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-px flex size-5 shrink-0 items-center justify-center rounded-full",
                  isCurrent
                    ? "bg-ai/10 text-ai"
                    : "bg-success/10 text-success",
                )}
                aria-hidden
              >
                {isCurrent ? (
                  <span className="size-2 animate-pulse rounded-full bg-ai" />
                ) : (
                  <Check className="size-3" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm leading-5",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {phase}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
