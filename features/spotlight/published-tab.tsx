"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EyeOff, Globe, Radio } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ClarityBlogPost } from "@/types/clarity";
import type { JourneyCoverage, PublishedPost } from "@/types/spotlight";
import { coverageNote } from "@/lib/blog-attribution";
import type { RefreshData } from "@/lib/refresh-loop";
import { PUBLISHED_VIEWS, sortUnpublished, type PublishedView } from "@/lib/unpublished";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/utils/format";

import { PublishedPostCard } from "./published-post-card";
import { RefreshView } from "./refresh-view";
import { UnpublishedPostCard } from "./unpublished-post-card";

/** Blog-health strip: how many posts are live and when the most recent one
 * went out. Counts only genuinely-live rows (`live: true`) — a reconciled-away
 * post still lists, but doesn't inflate the live count. */
function BlogHealth({ posts }: { posts: PublishedPost[] }) {
  const liveCount = posts.filter((post) => post.live).length;
  const lastPublished = useMemo(() => {
    const stamps = posts
      .map((post) => post.publishedAt)
      .filter((value): value is string => Boolean(value))
      .sort();
    return stamps.length > 0 ? stamps[stamps.length - 1] : null;
  }, [posts]);

  return (
    <Card className="gap-0">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-success" aria-hidden>
            <Radio className="size-4" />
          </span>
          {liveCount} {liveCount === 1 ? "post" : "posts"} live
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="size-4" aria-hidden />
          {lastPublished
            ? `Last published ${formatDate(lastPublished)}`
            : "Nothing published yet"}
        </span>
      </CardContent>
    </Card>
  );
}

function EmptyPublished({ unpublishedCount, onShowUnpublished }: { unpublishedCount: number; onShowUnpublished: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-muted-foreground" aria-hidden>
          <Globe className="size-8" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">No posts are live right now</p>
          <p className="text-sm text-muted-foreground">
            {unpublishedCount > 0 ? (
              <>
                {formatNumber(unpublishedCount)} {unpublishedCount === 1 ? "post was" : "posts were"} live and{" "}
                {unpublishedCount === 1 ? "is" : "are"} now unpublished —{" "}
                <button type="button" onClick={onShowUnpublished} className="text-primary hover:underline">
                  see them and publish again
                </button>
                . Or publish an approved draft from{" "}
              </>
            ) : (
              <>Publish an approved draft to see it here. Start from </>
            )}
            <Link href="/spotlight?tab=approvals" className="text-primary hover:underline">
              Approvals
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyUnpublished() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-muted-foreground" aria-hidden>
          <EyeOff className="size-8" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Nothing has been unpublished</p>
          <p className="text-sm text-muted-foreground">A post you unpublish, or one hidden or removed on Shopify, is listed here with when and why.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Live | Unpublished — local state over data already loaded (the Daily Picks
 * pattern, SPEC-163): a view change, never a navigation. */
function ViewTabs({ active, counts, onChange }: { active: PublishedView; counts: Record<PublishedView, number>; onChange: (view: PublishedView) => void }) {
  return (
    <div role="tablist" aria-label="Published views" className="flex w-fit gap-1 rounded-lg bg-muted p-0.5">
      {PUBLISHED_VIEWS.map((view) => {
        const selected = view.id === active;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(view.id)}
            className={cn("rounded-md px-3 py-1 text-sm font-medium transition-colors", selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {view.label} <span className="ml-1 text-xs tabular-nums opacity-70">{formatNumber(counts[view.id])}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The Published tab (backend SPEC-118, SPEC-279, SPEC-302): Live | Unpublished |
 * Worth rewriting. Live is
 * the blog-health strip over the live posts; Unpublished (SPEC-280) is every post
 * that was live and isn't, with when, why and what it earned. Unpublishing moves
 * a row from Live to Unpublished optimistically; Publish again moves it back
 * (both leave their query invalidated so the next paint agrees with the server).
 * `reach` (backend SPEC-119) carries a best-effort Search Console impressions
 * hint per draft id — absent/zero entries simply render no hint. */
export function PublishedTab({
  posts: initialPosts,
  unpublished: initialUnpublished = [],
  reach = {},
  coverage = null,
  engagement = {},
  refresh = null,
}: {
  posts: PublishedPost[];
  unpublished?: PublishedPost[];
  reach?: Record<number, number>;
  /** Clarity read-through keyed by draft id (backend SPEC-219). */
  engagement?: Record<number, ClarityBlogPost>;
  /** Journey coverage (backend SPEC-197); null when it could not be read. */
  coverage?: JourneyCoverage | null;
  /** The refresh loop (SPEC-305); null when it could not be read — the view then
   * shows its own empty state rather than failing the whole tab. */
  refresh?: RefreshData | null;
}) {
  const [view, setView] = useState<PublishedView>("live");
  const [posts, setPosts] = useState(initialPosts);
  const [unpublished, setUnpublished] = useState(() => sortUnpublished(initialUnpublished));
  const removePost = (id: number) => {
    const gone = posts.find((post) => post.id === id);
    setPosts((current) => current.filter((post) => post.id !== id));
    if (gone) setUnpublished((current) => sortUnpublished([{ ...gone, live: false, unpublishedAt: new Date().toISOString(), unpublishedReason: "owner" }, ...current]));
  };
  const republished = (id: number) => setUnpublished((current) => current.filter((post) => post.id !== id));

  // Only shown while coverage is partial — there is nothing to caveat otherwise.
  const note = coverageNote(coverage);
  const counts: Record<PublishedView, number> = {
    live: posts.filter((p) => p.live).length,
    unpublished: unpublished.length,
    refresh: refresh?.posts.length ?? 0,
  };

  return (
    <div className="space-y-4">
      <ViewTabs active={view} counts={counts} onChange={setView} />
      {view === "refresh" ? (
        <RefreshView
          data={refresh ?? { windowEnd: null, published: posts.length, scanned: 0, potentialClicks: 0, posts: [] }}
        />
      ) : view === "unpublished" ? (
        unpublished.length === 0 ? (
          <EmptyUnpublished />
        ) : (
          <div className="space-y-3">
            {unpublished.map((post) => (
              <UnpublishedPostCard key={post.id} post={post} impressions={reach[post.id]} onRepublished={republished} />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <EmptyPublished unpublishedCount={unpublished.length} onShowUnpublished={() => setView("unpublished")} />
      ) : (
        <>
          <BlogHealth posts={posts} />
          {/* Says how much of the window has actually been measured, so a zero above
              is never mistaken for proof that the blogs earned nothing. */}
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
          <div className="space-y-3">
            {posts.map((post) => (
              <PublishedPostCard key={post.id} post={post} impressions={reach[post.id]} engagement={engagement[post.id]} onRemoved={removePost} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
