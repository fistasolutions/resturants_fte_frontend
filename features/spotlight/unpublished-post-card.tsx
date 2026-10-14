"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, EyeOff, FileText, Globe, ShoppingBag, TrendingUp } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { summarizeBlogAttribution } from "@/lib/blog-attribution";
import { draftHref, shopifyImageUrl } from "@/lib/spotlight";
import { liveSpanLabel, unpublishedReasonLabel } from "@/lib/unpublished";
import { publishDraft } from "@/services/spotlight-actions";
import type { PublishedPost } from "@/types/spotlight";
import { formatCurrency, formatNumber } from "@/utils/format";

import { SeoBadge } from "./seo-badge";

/**
 * One post that was live and isn't (SPEC-280): when it was live, why it left,
 * what it earned while it was up — and Publish again, which re-shows the same
 * Shopify article (never a second copy, SPEC-196 Patches).
 */
export function UnpublishedPostCard({
  post,
  impressions,
  onRepublished,
}: {
  post: PublishedPost;
  /** Best-effort Search Console impressions (backend SPEC-119); hidden if absent. */
  impressions?: number;
  onRepublished: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attribution = summarizeBlogAttribution(post);
  const span = liveSpanLabel(post);

  async function republish() {
    setBusy(true);
    setError(null);
    try {
      await publishDraft(post.id);
      onRepublished(post.id);
      // Live reads the published list; it must pick this post up on the next paint.
      void queryClient.invalidateQueries({ queryKey: ["spotlight", "published"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-nowrap" data-unpublished-post>
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {post.imageUrl ? (
          <Image src={shopifyImageUrl(post.imageUrl, 160)} alt="" aria-hidden fill unoptimized loading="lazy" sizes="64px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={draftHref(post)} className="truncate text-sm font-medium text-foreground hover:underline">
            {post.title}
          </Link>
          {post.seoScore !== null && <SeoBadge score={post.seoScore} />}
          <span className="inline-flex h-5 items-center gap-1 rounded-4xl bg-muted px-2 text-[0.6875rem] font-medium text-muted-foreground">
            <EyeOff className="size-3" aria-hidden />
            {unpublishedReasonLabel(post.unpublishedReason)}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {post.targetKeyword}
          {post.persona ? ` · ${post.persona}` : ""}
          {span ? ` · ${span}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {typeof impressions === "number" && impressions > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="size-3" aria-hidden />
              {formatNumber(impressions)} impressions
            </span>
          )}
          {attribution.kind !== "none" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground" title={attribution.description}>
              <TrendingUp className="size-3 text-success" aria-hidden />
              {formatCurrency(attribution.revenue)}
              <span className="font-normal text-muted-foreground">
                · {formatNumber(attribution.orders)} {attribution.orders === 1 ? "order" : "orders"} while live
                {attribution.label ? ` · ${attribution.label}` : ""}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" aria-hidden />
              No attributed sales while live
            </span>
          )}
        </div>
        {error ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={draftHref(post)}>
            <FileText className="size-3.5" aria-hidden />
            Open draft
          </Link>
        </Button>
        <RoleButton need="spotlight.publish" size="sm" onClick={republish} disabled={busy} aria-label={`Publish again: ${post.title}`}>
          <Globe className="size-3.5" aria-hidden />
          {busy ? "Publishing…" : "Publish again"}
        </RoleButton>
      </div>
    </div>
  );
}
