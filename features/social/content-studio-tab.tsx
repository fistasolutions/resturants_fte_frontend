"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, History, ImagePlus, Layers, Loader2, RefreshCw, ThumbsUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleButton } from "@/components/shared/role-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CATEGORY,
  mergeDraftsByChannel,
  sortDrafts,
} from "@/lib/social-catalog";
import {
  channelsForSelection,
  draftsForSelection,
  type ChannelSelection,
} from "@/lib/social-studio";
import { draftToPostDetail, imageFailure } from "@/lib/social-post";
import {
  fetchMenuDrafts,
  fetchProductDrafts,
  generateMenuPost,
  generateSharedImage,
  generateSocialPost,
} from "@/services/social-actions";
import type {
  ProductDraft,
  SocialCategory,
  StudioProduct,
  StudioProductsPage,
} from "@/types/social";

import { CategoryNavRail } from "./category-nav-rail";
import { PostDetail } from "./post-detail";
import { PreviewImage } from "./preview-image";
import { ReasonChip } from "./social-pills";
import { MenuBrowser } from "./menu-browser";
import { StudioProductBrowser } from "./studio-product-browser";
import { WeeklyPlansPanel } from "./weekly-plans-panel";
import { GlispIcon } from "@/components/shared/glisp-icon";
import { useWorkspace } from "@/features/workspace/workspace-provider";

/* ── Channel selector (SPEC-133) ─────────────────────────────────────────── */

// This lucide version ships no brand icons; the repo's convention (social-pills)
// stands in Camera for Instagram and ThumbsUp for Facebook — neutral glyphs, per
// Rule 9 (platform identity is name + icon, never a brand color).
const CHANNEL_OPTIONS: { id: ChannelSelection; label: string; Icon: typeof Camera }[] = [
  { id: "instagram", label: "Instagram", Icon: Camera },
  { id: "facebook", label: "Facebook", Icon: ThumbsUp },
  { id: "both", label: "Both", Icon: Layers },
];

function ChannelSelector({
  value,
  onChange,
  disabled,
}: {
  value: ChannelSelection;
  onChange: (value: ChannelSelection) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Channels to generate for"
      className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {CHANNEL_OPTIONS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ApprovalsIndicator() {
  return (
    <Link
      href="/social?tab=approvals"
      className="inline-flex items-center gap-1.5 rounded-4xl border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
    >
      <CheckCircle2 className="size-3.5" aria-hidden />
      Saved to Approvals — review to schedule
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/* ── "What you'll get" ghost preview (pre-generation) ────────────────────────
 * A dashed placeholder that previews the shape of the post each selected channel
 * will produce — the real product image + the platform's native frame ratio +
 * skeleton caption/hashtag lines — so the empty state anticipates the outcome
 * instead of being a wall of text. Tokens only; no entrance animation. */
function GhostPreview({
  channel,
  product,
}: {
  channel: string;
  product: StudioProduct;
}) {
  const isInstagram = channel === "instagram";
  const Icon = isInstagram ? Camera : ThumbsUp;
  const label = isInstagram ? "Instagram" : "Facebook";
  const ratio = isInstagram ? "4 / 5" : "1.91 / 1";
  return (
    <div className="overflow-hidden rounded-card border border-dashed border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="ml-auto text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
          Preview
        </span>
      </div>
      <div className="opacity-55">
        <PreviewImage imageUrl={product.imageUrl} productName={product.name} ratio={ratio} />
      </div>
      <div className="space-y-2 p-3">
        <Skeleton className="h-2.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function StudioWorkspace({ product, menu = false }: { product: StudioProduct; menu?: boolean }) {
  const router = useRouter();
  const [selection, setSelection] = useState<ChannelSelection>("both");
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  // `null` = still hydrating from the server; `[]` = hydrated, none generated yet.
  const [drafts, setDrafts] = useState<ProductDraft[] | null>(null);
  // SPEC-186 — one art direction, one render, the same image on both channels.
  const [sharedBusy, setSharedBusy] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  // Bumped after a shared render so the panels remount and refetch their images.
  const [imageNonce, setImageNonce] = useState(0);

  const requested = channelsForSelection(selection);

  // Hydrate the persisted drafts on selection so previously generated
  // Instagram/Facebook drafts reappear instead of being lost (SPEC-134 bug fix).
  useEffect(() => {
    let active = true;
    // SPEC-389: a restaurant brand's dish keys its drafts by menu item.
    (menu ? fetchMenuDrafts(product.id) : fetchProductDrafts(product.id))
      .then((res) => {
        if (active) setDrafts(sortDrafts(res.posts));
      })
      .catch(() => {
        if (active) setDrafts([]);
      });
    return () => {
      active = false;
    };
  }, [product.id, menu]);

  async function generateSharedImageForAll(postIds: string[]) {
    setSharedBusy(true);
    setSharedError(null);
    try {
      const result = await generateSharedImage(postIds);
      if (!result.generated) {
        setSharedError(imageFailure(result));
        return;
      }
      setImageNonce((n) => n + 1);
    } catch (error) {
      setSharedError(
        error instanceof Error ? error.message : "Couldn't generate the image.",
      );
    } finally {
      setSharedBusy(false);
    }
  }

  async function generate() {
    setStatus("generating");
    setError(null);
    try {
      const res = menu
        ? await generateMenuPost(product.id, requested)
        : await generateSocialPost(product.id, requested);
      const incoming: ProductDraft[] = res.posts.map((post) => ({
        ...post,
        // SPEC-136: the overwrite path can preserve an existing image across a
        // caption regenerate — honor the server's flag instead of assuming none.
        hasImage: post.hasImage,
        imageConcept: null,
      }));
      // Merge by channel so regenerating one platform keeps the other's draft.
      setDrafts((prev) => mergeDraftsByChannel(prev ?? [], incoming));
      setStatus("idle");
      // The generated drafts persist as `in_review` — refresh so Approvals /
      // Overview counts reflect them if the user switches tabs.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate — try again.");
      setStatus("error");
    }
  }

  // The toggle filters what is SHOWN, not just what gets generated — switching
  // to Instagram must not leave a Facebook draft on screen.
  const visibleDrafts = draftsForSelection(drafts, selection);
  const hydrating = drafts === null;
  const generating = status === "generating";
  const hasDrafts = !!visibleDrafts && visibleDrafts.length > 0;
  // One draft gets the whole width and PostDetail's roomy two-column layout;
  // several drafts sit side by side and each stacks internally (`compact`).
  // Capping a single draft at `max-w-md` was starving PostDetail's right rail.
  const multiple = !!visibleDrafts && visibleDrafts.length > 1;
  const gridClass = multiple
    ? "grid grid-cols-1 gap-5 lg:grid-cols-2"
    : "w-full";

  const suggestedBanner = product.suggested && (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-success/30 bg-success/10 p-4">
      <GlispIcon className="size-4 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">I&apos;d feature this next</p>
        {product.reasonDetail && (
          <p className="text-xs text-muted-foreground">{product.reasonDetail}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {suggestedBanner}
      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-border sm:w-24">
              <PreviewImage
                imageUrl={product.imageUrl}
                productName={product.name}
                ratio="1 / 1"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="truncate">{product.name}</CardTitle>
                <ReasonChip reason={product.reason} />
              </div>
              <p className="text-sm text-muted-foreground">
                {product.category} · {product.priceLabel}
              </p>
              {product.reasonDetail && (
                <p className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                  <GlispIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {product.reasonDetail}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Generate for</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChannelSelector
                value={selection}
                onChange={setSelection}
                disabled={generating || hydrating}
              />
              <div className="flex flex-wrap items-center gap-3">
                <RoleButton
                  need="social.manage"
                  onClick={generate}
                  disabled={generating || hydrating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Generating…
                    </>
                  ) : hasDrafts ? (
                    <>
                      <RefreshCw className="size-4" aria-hidden />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <GlispIcon className="size-4" aria-hidden />
                      Generate content
                    </>
                  )}
                </RoleButton>
                {hasDrafts && !generating && <ApprovalsIndicator />}
              </div>
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {hydrating && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {[0, 1].map((index) => (
                <Skeleton key={index} className="h-[30rem] w-full rounded-card" />
              ))}
            </div>
          )}

          {!hydrating && generating && (
            <div
              className={
                requested.length > 1
                  ? "grid grid-cols-1 gap-5 lg:grid-cols-2"
                  : "grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start"
              }
            >
              {requested.map((channel) => (
                <Skeleton key={channel} className="h-[30rem] w-full rounded-card" />
              ))}
              {requested.length === 1 && (
                // Mirrors the details column so the layout does not jump when
                // the draft lands.
                <div className="hidden flex-col gap-3 lg:flex">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-4 w-56 rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* SPEC-186 — both channels of one product share ONE shoot. Two
              independent renders produced two unrelated images and cost twice. */}
          {!hydrating && !generating && hasDrafts && visibleDrafts!.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <RoleButton
                need="social.manage"
                variant="outline"
                onClick={() =>
                  void generateSharedImageForAll(visibleDrafts!.map((d) => d.postId))
                }
                disabled={sharedBusy}
              >
                {sharedBusy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Building one scene…
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-4" aria-hidden />
                    Generate one image for both
                  </>
                )}
              </RoleButton>
              <span className="text-xs text-muted-foreground">
                One shoot, both channels — half the cost, and they match.
              </span>
              {sharedError && (
                <p role="alert" className="text-sm text-destructive">
                  {sharedError}
                </p>
              )}
            </div>
          )}

          {!hydrating && !generating && hasDrafts && (
            <div className={gridClass}>
              {visibleDrafts!.map((post) => (
                <PostDetail
                  key={`${post.postId}-${imageNonce}`}
                  postId={post.postId}
                  initial={draftToPostDetail(post, product)}
                  // Only when drafts share the row: narrow columns beside each
                  // other, where the preview carries the caption and a separate
                  // readable block would repeat it. A lone draft has the whole
                  // width, so it gets the full layout.
                  compact={multiple}
                />
              ))}
            </div>
          )}

          {!hydrating && !generating && !hasDrafts && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GlispIcon className="size-3.5 text-primary" aria-hidden />
                What you&apos;ll get
              </p>
              <div
                className={
                  requested.length > 1
                    ? "grid grid-cols-1 gap-5 sm:grid-cols-2"
                    : "mx-auto w-full max-w-sm"
                }
              >
                {requested.map((channel) => (
                  <GhostPreview key={channel} channel={channel} product={product} />
                ))}
              </div>
              <p className="max-w-xl text-xs text-muted-foreground">
                Native-ready drafts — captions in your brand voice with per-format
                headlines + hashtags, grounded in your Brand Brain. Each draft saves to
                Approvals for your review before anything goes live.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Content Studio (SPEC-135 layout, SPEC-137/138 weekly plan). Left = the category
 * nav rail. Right has three modes: the product browser by default; the
 * SPEC-133/134 per-product generate view (clicking a product, drafts rendered
 * through the shared `PostDetail`); and the SPEC-138 Weekly Plans panel (history +
 * board + post detail). The browser and the plans panel are both kept mounted
 * (hidden) behind the other modes so returning restores their state with no
 * refetch — the plan persists across product browsing.
 */
export function ContentStudioTab({ initial }: { initial: StudioProductsPage }) {
  const [category, setCategory] = useState<SocialCategory>(DEFAULT_CATEGORY);
  const [selected, setSelected] = useState<StudioProduct | null>(null);
  const [planMode, setPlanMode] = useState(false);
  // Bumped by the header "Generate Weekly Plan" button to trigger a plan build
  // inside the (kept-mounted) plans panel (SPEC-142 fix 2).
  const [planGenerateNonce, setPlanGenerateNonce] = useState(0);

  function selectCategory(next: SocialCategory) {
    setPlanMode(false);
    setSelected(null);
    setCategory(next);
  }

  function openWeeklyPlans() {
    // Open the plans area at its history list.
    setSelected(null);
    setPlanMode(true);
  }

  function generateWeeklyPlan() {
    // The single "Generate Weekly Plan" entry point (SPEC-142 fix 2): open the
    // plans area and kick off a build via the nonce the panel watches.
    setSelected(null);
    setPlanMode(true);
    setPlanGenerateNonce((nonce) => nonce + 1);
  }

  const showBrowser = !selected && !planMode;
  // SPEC-389: a restaurant brand posts about dishes from its menu, not products.
  const restaurant = useWorkspace().features.includes("restaurant");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {restaurant
            ? "Plan the whole week at once, or pick a dish to draft one post at a time."
            : "Plan the whole week at once, or browse products to draft one at a time."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={openWeeklyPlans}>
            <History className="size-4" aria-hidden />
            Plan history
          </Button>
          <RoleButton need="social.manage" onClick={generateWeeklyPlan}>
            <GlispIcon className="size-4" aria-hidden />
            Generate Weekly Plan
          </RoleButton>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-4", !restaurant && "lg:grid-cols-[13rem_1fr]")}>
        {restaurant ? null : <CategoryNavRail category={category} onSelect={selectCategory} />}
        <div className="min-w-0">
          {/* Kept mounted (hidden) behind the other modes so returning restores
              the same page/scroll without a refetch. */}
          <div className={showBrowser ? undefined : "hidden"}>
            {restaurant ? (
              <MenuBrowser onSelect={setSelected} />
            ) : (
              <StudioProductBrowser
                key={category}
                category={category}
                initial={initial}
                onSelectProduct={setSelected}
              />
            )}
          </div>
          {selected && !planMode && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="size-4" aria-hidden />
                {restaurant ? "Back to the menu" : "Back to products"}
              </Button>
              {/* Keyed on product id so switching products remounts the workspace. */}
              <StudioWorkspace key={selected.id} product={selected} menu={restaurant} />
            </div>
          )}
          {/* Kept mounted (hidden) so the plan/history hydrates once and persists
              while the user browses; the top-right buttons drive it. */}
          <div className={planMode ? undefined : "hidden"}>
            <WeeklyPlansPanel
              onBack={() => setPlanMode(false)}
              generateNonce={planGenerateNonce}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
