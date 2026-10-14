"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  EyeOff,
  PencilLine,
  Rocket,
} from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publishDraft, unpublishDraft } from "@/services/spotlight-actions";
import type { BlogDraftStatus } from "@/types/spotlight";

/** Blog-detail publish control (backend SPEC-118). The primary action now
 * PUBLISHES to Shopify (not just marks approved): from `in_review`/`approved`
 * the owner clicks "Approve & publish", which pushes the article live and shows
 * the storefront URL. A `published` draft instead offers "View live" + Unpublish;
 * an `unpublished` draft offers a re-publish attempt. "Request changes" is kept
 * verbatim (opens the refine modal via `onRequestChanges`). All errors surface
 * inline — publishing can fail on a Shopify scope/write error and the message is
 * shown rather than swallowed.
 *
 * `layout="inline"` (SPEC-153 patch) renders the compact bar variant: the action
 * buttons only, no full-width status banners (the action bar already shows the
 * status chip), and errors break to their own line via `basis-full`. In
 * `changes_requested` the inline variant renders nothing — the bar's standalone
 * "Refine draft" button drives that state. */
export function PublishDecision({
  draftId,
  status,
  liveUrl,
  onRequestChanges,
  size = "default",
  layout = "block",
}: {
  draftId: number;
  status: BlogDraftStatus;
  liveUrl: string | null;
  /** Opens the caller's refine modal (edit brief → streamed regenerate). */
  onRequestChanges: () => void;
  /** Button size — `"sm"` for the slim action bar (SPEC-153 patch). */
  size?: "sm" | "default";
  /** `"inline"` = compact bar variant (buttons only, no banners). */
  layout?: "block" | "inline";
}) {
  const inline = layout === "inline";
  const router = useRouter();
  const [current, setCurrent] = useState<BlogDraftStatus>(status);
  const [url, setUrl] = useState<string | null>(liveUrl);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<"publish" | "unpublish" | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = running !== null || pending;

  async function runPublish() {
    setError(null);
    setRunning("publish");
    try {
      const updated = await publishDraft(draftId);
      setCurrent(updated.status);
      setUrl(updated.liveUrl);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish — try again.");
    } finally {
      setRunning(null);
    }
  }

  async function runUnpublish() {
    setError(null);
    setRunning("unpublish");
    try {
      const updated = await unpublishDraft(draftId);
      setCurrent(updated.status);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not unpublish — try again.",
      );
    } finally {
      setRunning(null);
    }
  }

  const iconSize = inline ? "size-3.5" : "size-4";
  const errorLine = error ? (
    <p className={cn("text-sm text-destructive", inline && "basis-full text-xs")}>
      {error}
    </p>
  ) : null;

  const viewLive = url ? (
    <Button variant="outline" size={size} asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className={iconSize} aria-hidden />
        View live
      </a>
    </Button>
  ) : null;

  // Live on Shopify — the reward state: link out + a way to pull it down.
  if (current === "published") {
    const actions = (
      <>
        {viewLive}
        <RoleButton
          need="spotlight.publish"
          variant="outline"
          size={size}
          onClick={runUnpublish}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground"
        >
          <EyeOff className={iconSize} aria-hidden />
          {running === "unpublish" ? "Unpublishing…" : "Unpublish"}
        </RoleButton>
      </>
    );
    if (inline) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {errorLine}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Published to your Shopify blog.
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
        {errorLine}
      </div>
    );
  }

  // Hidden but kept — offer to push it live again.
  if (current === "unpublished") {
    const publishAgain = (
      <RoleButton need="spotlight.publish" onClick={runPublish} size={size} disabled={busy}>
        <Rocket className={iconSize} aria-hidden />
        {running === "publish" ? "Publishing…" : "Publish again"}
      </RoleButton>
    );
    if (inline) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {publishAgain}
          {errorLine}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm font-medium text-muted-foreground"
          role="status"
        >
          <EyeOff className="size-4 shrink-0" aria-hidden />
          Unpublished — this post is not live.
        </div>
        {publishAgain}
        {errorLine}
      </div>
    );
  }

  // Sent back for changes — no publish action; the refine loop drives it. The
  // inline bar variant renders nothing here (the standalone "Refine draft" button
  // and the status chip already cover this state).
  if (current === "changes_requested") {
    if (inline) return null;
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-warning"
        role="status"
      >
        <PencilLine className="size-4 shrink-0" aria-hidden />
        Sent back for changes — refine the brief to rewrite it.
      </div>
    );
  }

  // in_review | approved | draft → the primary action publishes to Shopify.
  const reviewActions = (
    <>
      <RoleButton need="spotlight.publish" onClick={runPublish} size={size} disabled={busy}>
        <Rocket className={iconSize} aria-hidden />
        {running === "publish" ? "Publishing…" : "Approve & publish"}
      </RoleButton>
      {/* Request changes opens the refine modal, which rewrites the draft. */}
      <RoleButton
        need="spotlight.manage"
        variant="outline"
        size={size}
        onClick={onRequestChanges}
        disabled={busy}
      >
        <PencilLine className={iconSize} aria-hidden />
        Request changes
      </RoleButton>
    </>
  );
  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {reviewActions}
        {errorLine}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">{reviewActions}</div>
      {errorLine}
    </div>
  );
}
