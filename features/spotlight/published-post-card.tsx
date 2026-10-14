"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  EyeOff,
  ShoppingBag,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { draftHref, shopifyImageUrl } from "@/lib/spotlight";
import { summarizeBlogAttribution } from "@/lib/blog-attribution";
import type { ClarityBlogPost } from "@/types/clarity";
import { deleteFromSite, unpublishDraft } from "@/services/spotlight-actions";
import type { PublishedPost } from "@/types/spotlight";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

import { BlogReadThrough } from "./blog-read-through";
import { SeoBadge } from "./seo-badge";

/** One confirm-gated destructive/live action (Unpublish or Delete from site).
 * The dialog stays open until the request resolves so an inline error remains
 * visible; on success the parent removes the row optimistically. Mirrors the
 * DeleteDraftButton confirm pattern (SPEC-112). */
function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  busyLabel,
  destructive,
  onConfirm,
  onDone,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={busy}
            className={cn(
              destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {busy ? busyLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** A single published post (backend SPEC-118): thumbnail, title, live link,
 * publish date, optional SEO/persona enrichment, and the Unpublish / Delete-from
 * -site actions. A reconciled-away post (`live: false`) shows a subtle "not live"
 * note. Both actions remove the row optimistically once they succeed. */
export function PublishedPostCard({
  post,
  impressions,
  engagement,
  onRemoved,
}: {
  post: PublishedPost;
  /** Best-effort Search Console impressions (backend SPEC-119); hidden if absent. */
  impressions?: number;
  /** Clarity read-through for this post (backend SPEC-219); hidden if unmeasured. */
  engagement?: ClarityBlogPost;
  onRemoved: (id: number) => void;
}) {
  const remove = () => onRemoved(post.id);
  // Which of the three attribution measures this post can actually claim.
  const attribution = summarizeBlogAttribution(post);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-nowrap">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {post.imageUrl ? (
          <Image
            src={shopifyImageUrl(post.imageUrl, 160)}
            alt=""
            aria-hidden
            fill
            unoptimized
            loading="lazy"
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={draftHref(post)}
            className="truncate text-sm font-medium text-foreground hover:underline"
          >
            {post.title}
          </Link>
          {post.seoScore !== null && <SeoBadge score={post.seoScore} />}
          {!post.live && (
            <span className="inline-flex h-5 items-center gap-1 rounded-4xl bg-muted px-2 text-[0.6875rem] font-medium text-muted-foreground">
              <EyeOff className="size-3" aria-hidden />
              Not live
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {post.targetKeyword}
          {post.persona ? ` · ${post.persona}` : ""}
          {post.publishedAt ? ` · Published ${formatDate(post.publishedAt)}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {typeof impressions === "number" && impressions > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="size-3" aria-hidden />
              {formatNumber(impressions)} impressions
            </span>
          )}
          {/* Blog → sales attribution (backend SPEC-126 + SPEC-197): the ROI
              headline. The STRONGEST available measure is shown, always labelled
              with which one it is — a first-touch dollar is a weaker claim than a
              same-session dollar and must not be dressed as one. No measure at all
              still reads as an honest zero, never a fabricated number. */}
          {attribution.kind !== "none" ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground"
              title={attribution.description}
            >
              <TrendingUp className="size-3 text-success" aria-hidden />
              {formatCurrency(attribution.revenue)}
              <span className="font-normal text-muted-foreground">
                · {formatNumber(attribution.orders)}{" "}
                {attribution.orders === 1 ? "order" : "orders"}
                {attribution.label ? ` · ${attribution.label}` : ""}
              </span>
              <span className="sr-only">{attribution.description}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" aria-hidden />
              No attributed sales yet
            </span>
          )}
        </div>
        <BlogReadThrough post={engagement} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {post.liveUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={post.liveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" aria-hidden />
              View live
            </a>
          </Button>
        )}
        <ConfirmAction
          trigger={
            <RoleButton
              need="spotlight.publish"
              variant="outline"
              size="sm"
              aria-label={`Unpublish: ${post.title}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="size-3.5" aria-hidden />
              Unpublish
            </RoleButton>
          }
          title="Unpublish this post?"
          description="It will be hidden from your live site but kept here so you can publish it again later."
          confirmLabel="Unpublish"
          busyLabel="Unpublishing…"
          onConfirm={async () => {
            await unpublishDraft(post.id);
          }}
          onDone={remove}
        />
        <ConfirmAction
          trigger={
            <RoleButton
              need="spotlight.publish"
              variant="outline"
              size="sm"
              aria-label={`Delete from site: ${post.title}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete from site
            </RoleButton>
          }
          title="Delete this post from your site?"
          description="Delete removes this post from your live site. The Shopify article is deleted and the draft is reset."
          confirmLabel="Delete from site"
          busyLabel="Deleting…"
          destructive
          onConfirm={async () => {
            await deleteFromSite(post.id);
          }}
          onDone={remove}
        />
      </div>
    </div>
  );
}
