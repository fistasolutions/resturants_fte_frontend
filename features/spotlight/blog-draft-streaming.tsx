"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import { appendProgressPhase } from "@/lib/spotlight";
import { generateDraftStream } from "@/services/spotlight-actions";

import { BlogBanner } from "./blog-banner";
import { BlogGenerationProgress } from "./blog-generation-progress";
import { BlogWritingLoader } from "./blog-writing-loader";
import { GlispIcon } from "@/components/shared/glisp-icon";

type DraftInput = { queryId: number } | { keyword: string };

/** A pending side panel matching `blog-detail.tsx`'s `SidePanel` shape so the
 * ephemeral surface and the saved draft share one column layout and never jump
 * when `router.replace` lands. */
function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3">
      <CardContent className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

/** Muted placeholder bar (skeleton-pulse only — root Rule 9: no entrance
 * animation) standing in for a metric that only exists once the draft is saved. */
function PendingBar({ className }: { className: string }) {
  return <span className={`block h-3 animate-pulse rounded-full bg-muted ${className}`} />;
}

/**
 * Live "new draft" GENERATION surface (SPEC-115 Patches). First-generation runs
 * the multi-round quality harness (SPEC-121) — write → critique → REWRITE, up to
 * 5 rounds — so streaming the token body would show the owner drafts that are
 * about to be discarded. Instead this surface reveals the harness PROGRESS: the
 * taller {@link BlogWritingLoader} skeleton plus a {@link BlogGenerationProgress}
 * timeline that accumulates the `{status}` frames ("Researching → Writing →
 * Scoring (SEO/AEO/GEO) → Revising round 2 → Final"), then reveals the final
 * best article once it lands. The refine/regenerate loop in `blog-detail.tsx`
 * keeps its live token-by-token typing — it has one article on screen and never
 * discards a draft.
 *
 * On mount it opens the SSE stream (`generateDraftStream`, backend
 * `POST /spotlight/drafts/stream`): only `onStatus` is consumed (the body
 * `onDelta` is intentionally ignored on this surface). On the terminal
 * `{"draft_id"}` frame it `router.replace('/spotlight/draft/{id}')` so history
 * lands on the real saved draft (final banner/image/grounding/scorecard/FAQ/
 * shop-the-look) and Back never returns here.
 *
 * The stream is aborted on unmount so a route change — or the dev StrictMode
 * double-mount — never leaves an orphan draft in the shared store.
 */
export function BlogDraftStreaming({
  queryId,
  keyword,
}: {
  queryId?: number;
  keyword?: string;
}) {
  const router = useRouter();
  // Accumulated harness phases, in order. The latest is the phase in progress;
  // consecutive duplicates are collapsed so the timeline never repeats a line.
  const [phases, setPhases] = useState<string[]>(["Starting…"]);
  const [error, setError] = useState<string | null>(null);
  // Writing a draft needs the role's permission (SPEC-358): without it the stream is
  // never opened and the reason takes the error's place.
  const can = useCan();
  const gate = can("spotlight.manage");
  const allowed = gate.allowed;
  const problem = allowed ? error : gate.reason;

  const input = useMemo<DraftInput>(
    () => (queryId != null ? { queryId } : { keyword: keyword ?? "" }),
    [queryId, keyword],
  );

  // Provisional title: the raw keyword when the owner typed one, otherwise a
  // neutral composing line (a query-bank item is addressed only by id here).
  const provisionalTitle = keyword?.trim() ? keyword.trim() : "Composing your article…";

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const draftId = await generateDraftStream(
          input,
          // Collapse consecutive duplicate frames so a repeated phrase never
          // adds a second timeline row (shared helper — SPEC-151).
          (phrase) => setPhases((current) => appendProgressPhase(current, phrase)),
          // Body deltas are intentionally ignored on the generation surface —
          // the harness discards intermediate drafts, so only progress shows.
          undefined,
          controller.signal,
        );
        // Land on the real saved draft. `replace` (not `push`) so Back skips
        // this ephemeral /new surface.
        // The id is all the stream frame carries; the slug URL takes over on
        // the next navigation, and the backend resolves both (SPEC-165).
        router.replace(`/spotlight/draft/${draftId}`);
      } catch (err) {
        // A cancelled stream (unmount / StrictMode) is expected — stay silent.
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Could not generate — try again.",
        );
      }
    })();
    return () => controller.abort();
  }, [allowed, input, router]);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/spotlight?tab=inbound"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to Inbound Engine
        </Link>
        <span className="inline-flex h-5 items-center rounded-4xl bg-ai/10 px-2 text-[0.6875rem] font-medium text-ai">
          Writing…
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <article>
          <Card className="overflow-hidden">
            <CardContent className="p-5 md:p-8">
              <BlogBanner
                imageUrl={null}
                eyebrow="Writing…"
                title={provisionalTitle}
                byline={
                  <>
                    <span>By the editorial team</span>
                    <span aria-hidden>·</span>
                    <span>Drafting live</span>
                  </>
                }
              />
              {problem ? (
                <div className="mt-6 space-y-4 rounded-card border border-destructive/30 bg-destructive/5 p-6">
                  <p className="text-sm text-foreground">{problem}</p>
                  <Link
                    href="/spotlight?tab=inbound"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Back to Inbound Engine
                  </Link>
                </div>
              ) : (
                // Generation shows harness PROGRESS (never the discarded live
                // drafts): the taller writing skeleton fronted by the phase
                // timeline. The final article is revealed via `router.replace`
                // once `draft_id` lands.
                <BlogWritingLoader
                  header={<BlogGenerationProgress phases={phases} />}
                />
              )}
            </CardContent>
          </Card>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <SidePanel title="Written by">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden
              >
                <GlispIcon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Blog Writer
                </p>
                <p className="text-xs text-muted-foreground">OpenAI Agents SDK</p>
              </div>
            </div>
            {!problem && (
              <p
                className="flex items-center gap-2 text-xs text-ai"
                role="status"
                aria-live="polite"
              >
                <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-ai" />
                {phases[phases.length - 1]}
              </p>
            )}
          </SidePanel>

          <SidePanel title="Grounded on">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Persona</span>
                <PendingBar className="w-24" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">POV pillar</span>
                <PendingBar className="w-20" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Guardrails</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Checking…
                </span>
              </div>
            </div>
          </SidePanel>

          <SidePanel title="SEO & publish">
            <p className="text-xs text-muted-foreground">
              SEO score, keyword and internal links are calculated once the draft
              is written.
            </p>
            <div className="space-y-2 border-t border-border pt-3">
              <PendingBar className="w-full" />
              <PendingBar className="w-4/5" />
              <PendingBar className="w-2/3" />
            </div>
          </SidePanel>
        </aside>
      </div>
    </main>
  );
}
