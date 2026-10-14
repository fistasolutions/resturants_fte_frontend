"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, ImagePlus, Loader2, PanelRightOpen, RefreshCw, ShieldCheck, ShieldX, Wand2 } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  appendProgressPhase,
  beatLines,
  draftReadMinutes,
  draftStatusLabel,
  firstParagraphLineNumber,
  hasFullQualityScores,
  heroUrl,
  overallQualityScore,
  planL5Flow,
  seoTone,
  splitBodyFaq,
  splitBodyIntoSections,
} from "@/lib/spotlight";
import { generateHero, regenerateDraftStream } from "@/services/spotlight-actions";
import type { BeatBrief, BlogDraft } from "@/types/spotlight";
import { formatNumber } from "@/utils/format";

import { BlogFaq } from "./blog-faq";
import { BlogGallery } from "./blog-gallery";
import { BlogGenerationProgress } from "./blog-generation-progress";
import { BlogHero } from "./blog-hero";
import { BlogMarkdown } from "./blog-markdown";
import { BlogSplit } from "./blog-split";
import { BlogWritingLoader } from "./blog-writing-loader";
import { DeleteDraftButton } from "./delete-draft-button";
import { PublishDecision } from "./publish-decision";
import {
  QualityScorecard,
  ResearchedSources,
  ScoringDisclosure,
} from "./quality-scorecard";
import { RefineDraftDialog } from "./refine-draft-dialog";
import { ShopTheLook } from "./shop-the-look";
import { GlispIcon } from "@/components/shared/glisp-icon";

const STATUS_CLASS: Record<BlogDraft["status"], string> = {
  in_review: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  changes_requested: "bg-destructive/10 text-destructive",
  published: "bg-success/10 text-success",
  unpublished: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
};

const QUALITY_TONE = {
  strong: "bg-success/10 text-success",
  fair: "bg-warning/10 text-warning",
  weak: "bg-destructive/10 text-destructive",
} as const;

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

/** The page-one competitor article this draft was planned against (SPEC-292):
 * the page, then what the plan covered and added. The article itself never names
 * the competitor — this panel is for the owner. */
function WrittenToBeat({ beat }: { beat: BeatBrief }) {
  const lines = beatLines(beat);
  return (
    <div className="space-y-2 text-xs">
      <a
        href={beat.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 rounded-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        title={beat.url}
      >
        <ExternalLink className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{beat.domain}</span>
      </a>
      {beat.title ? <p className="text-muted-foreground">“{beat.title}”</p> : null}
      <p className="text-foreground">{lines.covered}</p>
      {lines.added ? <p className="text-muted-foreground">{lines.added}</p> : null}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function BlogDetail({ draft }: { draft: BlogDraft }) {
  const grounding = draft.grounding;
  const persona = grounding?.personaId ?? draft.persona;
  const povPillar = grounding?.povPillar || draft.povPillar;
  const products = grounding?.products ?? [];
  const heroProduct = products.find((product) => product.imageUrl) ?? null;
  const trace = draft.agentTrace ?? [];

  // Overall quality readout for the action-bar badge (full scorecard lives in the
  // Details drawer). Only shown once the harness has scored every dimension.
  const qualityScores = {
    seo: draft.seoScore,
    aeo: draft.aeoScore,
    geo: draft.geoScore,
    quality: draft.qualityScore,
  };
  const overallQuality = overallQualityScore(qualityScores);
  const showQualityBadge = hasFullQualityScores(qualityScores);

  // ── Rich reading experience (SPEC-124): FAQ accordion + shop-the-edit. The FAQ
  // prose is lifted out of the body so it isn't rendered twice (once as prose,
  // once as the accordion). The L5 layout (SPEC-153) has no on-page TOC.
  const faq = draft.faq ?? [];
  const { body: readingBody, faqHeadingId } = splitBodyFaq(draft.bodyMd ?? "");

  // ── Minimal-Luxury layout (SPEC-153): split the body into an intro + `## H2`
  // sections, then interleave the real grounded product images — most as
  // full-bleed galleries, one as the L5 image/text split. The drop-cap lands on
  // the intro's first paragraph, or the first PROSE section's when there's no
  // intro (never a section consumed into the split).
  const { intro, sections } = splitBodyIntoSections(readingBody);
  const flow = planL5Flow(sections, products);
  const introHasDropCap = intro !== "" && firstParagraphLineNumber(intro) !== null;
  const dropCapSectionId = introHasDropCap
    ? null
    : flow.find((item) => item.kind === "section")?.section.id ?? null;

  // ── Refine loop (SPEC-117; SPEC-151): edit the brief → regenerate → the SAME
  // staged progress animation a new blog shows (the harness discards
  // intermediate drafts, so no live token typing) → refresh to the finished
  // draft. The streamed body deltas are intentionally ignored; only the
  // `status` frames drive the timeline.
  const router = useRouter();
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState(draft.prompt ?? "");
  const [regenerating, setRegenerating] = useState(false);
  // Accumulated harness phases, in order (latest = in progress); consecutive
  // duplicates collapsed via `appendProgressPhase` so the timeline never repeats.
  const [phases, setPhases] = useState<string[]>([]);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Keep the loader up until the refreshed draft has actually painted (avoids a
  // flash of stale content between the stream ending and the RSC re-render).
  const settlingRef = useRef(false);
  // The details panel is portaled to <body> and fixed-positioned, so it needs the
  // toolbar's real height to sit flush beneath it. Hardcoding 56px broke the
  // moment the toolbar grew a second row (the "Designing your header…" status
  // line) — and it would break again whenever the controls wrap on a narrow
  // screen. Measured instead, so the panel tracks the toolbar whatever it does.
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(56);

  // ── Editorial hero (SPEC-122): the AI-composited banner. `heroVersion` is the
  // cache-bust key (draft.updatedAt, restamped on each regenerate). `heroExists`
  // starts unknown and resolves off the banner's load/error so the control reads
  // "Generate header" (none) vs "Regenerate header" (present) without a flag on
  // the draft payload.
  const [heroVersion, setHeroVersion] = useState<string | null>(draft.updatedAt);
  const [heroExists, setHeroExists] = useState<boolean | null>(null);
  const [heroBusy, setHeroBusy] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const heroSrc = heroUrl(draft.id, heroVersion);

  async function handleGenerateHero() {
    setHeroError(null);
    setHeroBusy(true);
    try {
      const result = await generateHero(draft.id);
      if (result.hasHero) {
        setHeroVersion(result.updatedAt ?? new Date().toISOString());
        setHeroExists(true);
      } else {
        setHeroError("Couldn't design a header this time — please try again.");
      }
    } catch (error) {
      setHeroError(
        error instanceof Error
          ? error.message
          : "Couldn't design a header — please try again.",
      );
    } finally {
      setHeroBusy(false);
    }
  }

  useEffect(() => {
    if (settlingRef.current && !isPending) {
      settlingRef.current = false;
      setRegenerating(false);
      setPhases([]);
    }
  }, [isPending]);

  function openRefine() {
    setRefineError(null);
    setRefinePrompt(draft.prompt ?? "");
    setRefineOpen(true);
  }

  async function handleRegenerate() {
    const prompt = refinePrompt.trim();
    if (!prompt) return;
    setRefineError(null);
    setRefineOpen(false);
    setRegenerating(true);
    setPhases(["Preparing to rewrite…"]);
    try {
      // Consume only the harness `status` frames (collapsing consecutive dups)
      // and reveal them as the staged progress animation — the body deltas are
      // intentionally ignored, exactly as the new-blog generation surface does.
      const draftId = await regenerateDraftStream(draft.id, prompt, (phrase) =>
        setPhases((current) => appendProgressPhase(current, phrase)),
      );
      settlingRef.current = true;
      // A rewrite can retitle the draft, and the slug follows the title — so a
      // `router.refresh()` here re-fetched the OLD slug and 404'd on the page's own
      // successful action (observed live 2026-09-12). Navigate by id instead, exactly
      // as the new-draft surface does: the backend resolves both (SPEC-165), and the
      // page lands on whatever the draft is now called. `replace`, so Back does not
      // return to a dead address.
      startTransition(() => router.replace(`/spotlight/draft/${draftId}`));
    } catch (error) {
      setRegenerating(false);
      setPhases([]);
      // Resurface the modal with the message; the typed instruction is intact.
      setRefineError(
        error instanceof Error ? error.message : "Could not rewrite — try again.",
      );
      setRefineOpen(true);
    }
  }

  const heroLabel = heroBusy
    ? "Designing your header…"
    : heroExists
      ? "Regenerate header"
      : "Generate header";
  const HeroIcon = heroBusy ? Loader2 : heroExists ? RefreshCw : ImagePlus;

  useEffect(() => {
    const node = toolbarRef.current;
    if (!node) return;
    const measure = () => setToolbarHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="p-4 md:p-6">
      {/* ── Slim sticky action bar (SPEC-153 patch): every review control lives
          here above the full-width article — draft status, quality badge, hero
          generate/regenerate, refine, approve/request-changes, the Details drawer,
          and delete. `flex-wrap` stacks it cleanly on mobile. ── */}
      <div
        ref={toolbarRef}
        className="sticky top-0 z-30 -mx-4 -mt-4 mb-6 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-6 md:-mt-6 md:px-6"
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href="/spotlight?tab=inbound"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back
          </Link>
          <span
            className={cn(
              "inline-flex h-5 items-center rounded-4xl px-2 text-[0.6875rem] font-medium",
              STATUS_CLASS[draft.status],
            )}
          >
            {draftStatusLabel(draft.status)}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {draft.targetKeyword}
          </span>
          {showQualityBadge && (
            <span
              className={cn(
                "inline-flex h-5 items-center gap-1 rounded-4xl px-2 text-[0.6875rem] font-medium tabular-nums",
                QUALITY_TONE[seoTone(overallQuality)],
              )}
              title="Overall quality score"
            >
              Quality {overallQuality}
            </span>
          )}

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <RoleButton
              need="spotlight.manage"
              size="sm"
              variant="outline"
              onClick={handleGenerateHero}
              disabled={heroBusy || regenerating}
              aria-live="polite"
            >
              <HeroIcon
                className={cn("size-3.5", heroBusy && "animate-spin")}
                aria-hidden
              />
              <span className="whitespace-nowrap">{heroLabel}</span>
            </RoleButton>
            <RoleButton
              need="spotlight.manage"
              size="sm"
              variant="outline"
              onClick={openRefine}
              disabled={regenerating}
            >
              <Wand2 className="size-3.5" aria-hidden />
              <span className="whitespace-nowrap">Refine draft</span>
            </RoleButton>
            <PublishDecision
              draftId={draft.id}
              status={draft.status}
              liveUrl={draft.liveUrl}
              onRequestChanges={openRefine}
              size="sm"
              layout="inline"
            />
            {/* Drops DOWN from under the sticky toolbar, pinned to the right —
                the mega-menu shape the owner asked for (SPEC-165 Patch 2).
                Built on `side="top"` for its slide-down animation, then
                re-anchored to the right edge. The overrides carry the SAME
                `data-[side=top]:` prefix as the base classes so tailwind-merge
                actually resolves them — a bare `right-0` would lose to the
                variant-prefixed `inset-x-0` and the panel would go full-bleed
                again, which is exactly what it did as a plain top sheet.
                `top-14` matches the toolbar's height (py-3 + an h-8 button). */}
            {/* `modal={false}` + no overlay (SPEC-165 Patch 3): this is a MENU
                hanging off the toolbar, not a modal. Dimming the page — the
                article, the toolbar, the whole sidebar — made it read as
                "stop and deal with this", which a details panel should not.
                The page stays lit, scrollable and clickable; Escape and
                click-outside still dismiss.
                Width: a real right-hand COLUMN (40rem, capped at 40vw so it
                stays a column on an ultrawide instead of half the screen),
                full width below `sm` where a 40rem panel would not fit. */}
            <Sheet modal={false}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline">
                  <PanelRightOpen className="size-3.5" aria-hidden />
                  <span className="whitespace-nowrap">Details</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                showOverlay={false}
                style={{
                  top: toolbarHeight,
                  height: `calc(100dvh - ${toolbarHeight}px)`,
                }}
                className="scrollbar-subtle w-full gap-0 overflow-y-auto border-b-0 border-l shadow-xl sm:w-[min(40rem,40vw)] data-[side=top]:inset-x-auto data-[side=top]:right-0"
              >
                <SheetHeader className="border-b border-border">
                  <SheetTitle>Draft details</SheetTitle>
                  <SheetDescription>
                    How this post was written, grounded, and scored.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 p-4">
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
                        <p className="text-xs text-muted-foreground">
                          OpenAI Agents SDK
                        </p>
                      </div>
                    </div>
                    {trace.length > 0 && (
                      <ol className="mt-1 space-y-2 border-l border-border pl-4">
                        {trace.map((step, i) => (
                          <li
                            key={i}
                            className="relative text-xs leading-relaxed text-muted-foreground before:absolute before:top-1.5 before:-left-[1.3125rem] before:size-1.5 before:rounded-full before:bg-success"
                          >
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </SidePanel>

                  <SidePanel title="Grounded on">
                    <div className="space-y-2">
                      <MetaLine label="Persona" value={persona} />
                      {povPillar && <MetaLine label="POV pillar" value={povPillar} />}
                      <MetaLine
                        label="Guardrails"
                        value={
                          grounding?.guardrailsOk ?? true ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <ShieldCheck className="size-3.5" aria-hidden />
                              Respected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <ShieldX className="size-3.5" aria-hidden />
                              Review
                            </span>
                          )
                        }
                      />
                    </div>
                    {products.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <p className="mb-1.5 text-xs text-muted-foreground">
                          Internal links · {products.length}{" "}
                          {products.length === 1 ? "product" : "products"}
                        </p>
                        <ul className="space-y-1">
                          {products.map((p) => (
                            <li
                              key={p.productId}
                              className="truncate text-xs text-foreground"
                            >
                              {p.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </SidePanel>

                  <SidePanel title="Quality">
                    <QualityScorecard draft={draft} />
                    {draft.critique.length > 0 && (
                      <ScoringDisclosure critique={draft.critique} />
                    )}
                    <div className="space-y-2 border-t border-border pt-3">
                      <MetaLine label="Target keyword" value={draft.targetKeyword} />
                      <MetaLine
                        label="Word count"
                        value={formatNumber(draft.wordCount)}
                      />
                      <MetaLine
                        label="Internal links"
                        value={`${products.length} ${products.length === 1 ? "product" : "products"}`}
                      />
                      <MetaLine label="Publishes to" value="/blogs/news" />
                    </div>
                  </SidePanel>

                  {draft.beat && (
                    <SidePanel title="Written to beat">
                      <WrittenToBeat beat={draft.beat} />
                    </SidePanel>
                  )}

                  {draft.sources.length > 0 && (
                    <SidePanel title="Researched sources">
                      <ResearchedSources sources={draft.sources} />
                    </SidePanel>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <DeleteDraftButton
              draftId={draft.id}
              size="sm"
              label={`Delete draft: ${draft.title}`}
            />
          </div>
        </div>
        {(heroBusy || heroError) && (
          <div className="mx-auto mt-2 w-full max-w-[1600px]">
            {heroBusy && (
              <p className="text-xs text-muted-foreground">
                Designing your header — this takes around 30 seconds. You can keep
                reading while it works.
              </p>
            )}
            {heroError && (
              <p className="text-xs text-destructive" role="alert">
                {heroError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Full-width centered L5 reader (SPEC-153): a single centered article
          column, no squeezing aside. ── */}
      <article className="mx-auto w-full max-w-[1600px]">
        <Card className="overflow-hidden">
          <CardContent className="p-5 md:p-8 lg:p-10">
            {/* ── L5 title block: centered, ABOVE the hero (SPEC-153) ── */}
            <header className="mx-auto max-w-[62rem] pt-4 text-center md:pt-10 lg:pt-14">
              <p className="mb-5 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {povPillar || "Journal"}
              </p>
              <h1 className="font-heading text-balance text-[clamp(2.25rem,6vw,5rem)] leading-[1.02] tracking-tight text-foreground">
                {draft.title}
              </h1>
              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                <span>By the editorial team</span>
                <span aria-hidden>·</span>
                <span>{draftReadMinutes(draft.wordCount)} min</span>
                <span aria-hidden>·</span>
                <span>For {persona}</span>
              </p>
            </header>

            {/* ── L5 hero: full-width cinematic band BELOW the title, no text.
                Breaks out to the card's interior edges (`-mx` cancels the
                CardContent padding; the Card is overflow-hidden). ── */}
            <div className="mt-10 -mx-5 md:mt-14 md:-mx-8 lg:-mx-10">
              <BlogHero
                imageUrl={heroProduct?.imageUrl ?? null}
                heroUrl={heroSrc}
                generating={heroBusy}
                onHeroLoad={() => setHeroExists(true)}
                onHeroError={() => setHeroExists((prev) => prev ?? false)}
              />
            </div>

            {regenerating ? (
              // Refine shows the SAME staged progress animation a new blog
              // shows (SPEC-151) — the harness discards intermediate drafts, so
              // no live token typing. `router.refresh()` reveals the finished
              // draft once the stream ends.
              <BlogWritingLoader
                header={<BlogGenerationProgress phases={phases} />}
              />
            ) : (
              // Minimal-Luxury reading experience (SPEC-153): a centered 60ch
              // reading column, slightly larger prose, drop-cap intro, the meta
              // description as a centered lede — against full-bleed galleries and
              // one image/text split that break out to the card edges.
              <div className="mt-12 md:mt-16">
                {/* Lede — the meta description as a centered editorial deck. */}
                {draft.metaDescription && (
                  <p className="mx-auto mb-12 max-w-[900px] text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
                    {draft.metaDescription}
                  </p>
                )}
                {readingBody ? (
                  <>
                    {intro && (
                      <div className="mx-auto max-w-[900px]">
                        <BlogMarkdown
                          content={intro}
                          size="lg"
                          enableDropCap={introHasDropCap}
                        />
                      </div>
                    )}
                    {flow.map((item, index) =>
                      item.kind === "gallery" ? (
                        <div
                          key={`gallery-${index}`}
                          className="-mx-5 md:-mx-8 lg:-mx-10"
                        >
                          <BlogGallery products={item.products} />
                        </div>
                      ) : item.kind === "split" ? (
                        <div
                          key={`split-${item.section.id}`}
                          className="mt-12 -mx-5 md:mt-16 md:-mx-8 lg:-mx-10"
                        >
                          <BlogSplit
                            section={item.section}
                            product={item.product}
                            eyebrow={povPillar || "In focus"}
                          />
                        </div>
                      ) : (
                        <div
                          key={item.section.id}
                          className="mx-auto mt-12 max-w-[900px] md:mt-14"
                        >
                          <BlogMarkdown
                            content={item.section.body}
                            headingId={item.section.id}
                            size="lg"
                            enableDropCap={item.section.id === dropCapSectionId}
                          />
                        </div>
                      ),
                    )}
                  </>
                ) : (
                  <p className="mx-auto max-w-[900px] text-sm text-muted-foreground">
                    This draft has no body yet.
                  </p>
                )}
                {/* "Shop the edit" spans the full content width; FAQ stays in
                    the centered reading measure. */}
                <ShopTheLook products={products} />
                <div className="mx-auto max-w-[900px]">
                  <BlogFaq items={faq} id={faqHeadingId ?? undefined} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </article>

      <RefineDraftDialog
        open={refineOpen}
        onOpenChange={(open) => {
          setRefineOpen(open);
          if (!open) setRefineError(null);
        }}
        value={refinePrompt}
        onValueChange={setRefinePrompt}
        onRegenerate={handleRegenerate}
        error={refineError}
      />
    </main>
  );
}
