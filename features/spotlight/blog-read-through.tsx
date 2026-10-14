import { BookOpenCheck, MousePointerClick, Timer } from "lucide-react";

import { readThrough } from "@/lib/clarity";
import { cn } from "@/lib/utils";
import type { ClarityBlogPost } from "@/types/clarity";

/**
 * How far readers actually get into one published post (backend SPEC-219).
 *
 * Spotlight has scored its own work since day one — SEO, AEO, GEO, quality — but every
 * one of those is a checklist the writer can satisfy without a human ever reading the
 * article. This is the first line on the page that comes from a reader.
 *
 * Deliberately renders nothing when unmeasured rather than a zero: "we have not looked"
 * and "nobody read it" demand opposite reactions, and only one of them is the writer's
 * fault.
 */
export function BlogReadThrough({ post }: { post: ClarityBlogPost | undefined }) {
  if (!post || !post.measured) return null;

  const verdict = readThrough({
    measured: post.measured,
    wordCount: post.wordCount,
    avgScrollDepth: post.avgScrollDepth,
    stopsAroundWord: post.stopsAroundWord,
  });
  const depth = verdict.depth ?? 0;
  // Under a third read is a length problem, not a scoring problem.
  const thin = depth < 0.33;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          thin ? "text-destructive" : "text-foreground",
        )}
      >
        <BookOpenCheck className="size-3.5" aria-hidden />
        {verdict.summary}
      </span>
      {post.avgActiveSeconds !== null && post.avgActiveSeconds > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="size-3" aria-hidden />
          {Math.round(post.avgActiveSeconds)}s reading
        </span>
      )}
      {post.rageClicks !== null && post.rageClicks > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <MousePointerClick className="size-3" aria-hidden />
          {post.rageClicks} rage clicks
        </span>
      )}
    </div>
  );
}
