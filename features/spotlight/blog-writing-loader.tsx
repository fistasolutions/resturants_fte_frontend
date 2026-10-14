import { PenLine } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The Spotlight "writing" loader (SPEC-117, backend SPEC-113/114): shown only
 * BEFORE the first streamed token, while the agent is still grounding (Reading
 * Brand Brain / Pulling best-sellers). The article body is replaced by this
 * article-shaped skeleton so it reads like the post is being composed live — a
 * heading bar, faux subheads, and paragraph lines of varied widths whose
 * highlight sweeps across in a staggered CSS shimmer, with the live status
 * phrase shown prominently above and a blinking caret at the writing position.
 * It fills a typical article body area (min-height) so it never reads as a short,
 * cramped block; once the first delta arrives the caller swaps it for the live
 * streaming text (SPEC-114).
 *
 * CSS-only (root Rule 9 — no framer-motion): the shimmer/caret keyframes live in
 * `globals.css` and stop under `prefers-reduced-motion`, leaving a gentle static
 * pulse. Semantic tokens only, so it holds in both themes.
 */

/** Each row's width class + a shimmer start delay (ms) so lines "type" in turn.
 * `head`/`sub` render taller bars; `caret` marks the current writing position.
 * A full article's worth of lines/subheads so the skeleton fills the body. */
const LINES: { w: string; kind?: "head" | "sub"; caret?: boolean }[] = [
  { w: "w-3/4", kind: "head" },
  { w: "w-full" },
  { w: "w-11/12" },
  { w: "w-5/6" },
  { w: "w-2/5", kind: "sub" },
  { w: "w-full" },
  { w: "w-full" },
  { w: "w-2/3" },
  { w: "w-1/3", kind: "sub" },
  { w: "w-11/12" },
  { w: "w-full" },
  { w: "w-4/5" },
  { w: "w-2/5", kind: "sub" },
  { w: "w-full" },
  { w: "w-5/6" },
  { w: "w-1/2", caret: true },
];

const HEIGHT = { head: "h-7 md:h-8", sub: "h-5", body: "h-4" } as const;

/**
 * @param status Live "someone is writing" phrase shown above the skeleton
 *   (refine loop + route loading fallback). Ignored when `header` is supplied.
 * @param header Optional custom header rendered in place of the single status
 *   line — the first-generation surface passes a harness progress timeline here
 *   so the owner watches "Researching → Writing → Scoring → Revising → Final"
 *   instead of a single phrase. Backward compatible: omit it and the default
 *   status line renders exactly as before.
 */
export function BlogWritingLoader({
  status,
  header,
}: {
  status?: string;
  header?: React.ReactNode;
}) {
  return (
    <div className="mt-6 min-h-[420px] md:min-h-[520px]" aria-busy>
      {/* Live status phrase — the prominent "someone is writing" cue — unless a
          richer header (e.g. the generation progress timeline) is provided. */}
      {header ?? (
        <div
          className="flex items-center gap-2 text-ai"
          role="status"
          aria-live="polite"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai/10">
            <PenLine className="size-4 animate-pulse" aria-hidden />
          </span>
          <span className="text-sm font-medium">{status}</span>
        </div>
      )}

      {/* Article-shaped skeleton. Each bar shimmers on its own staggered delay. */}
      <div className="mt-6 space-y-4">
        {LINES.map((line, i) => {
          const height =
            line.kind === "head"
              ? HEIGHT.head
              : line.kind === "sub"
                ? HEIGHT.sub
                : HEIGHT.body;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center",
                line.kind === "sub" && "pt-2",
                line.kind === "head" && "mb-2",
              )}
            >
              <span
                className={cn("writing-line animate-pulse", height, line.w)}
                style={
                  { "--shimmer-delay": `${i * 110}ms` } as React.CSSProperties
                }
              />
              {line.caret && <span className="writing-caret ml-1 self-center" />}
            </div>
          );
        })}
      </div>

      <span className="sr-only">The writer is revising this draft.</span>
    </div>
  );
}
