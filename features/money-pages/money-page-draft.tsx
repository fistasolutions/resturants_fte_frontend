"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Info } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  MAX_META_DESCRIPTION,
  MAX_SEO_TITLE,
  liveTitleOf,
  plainText,
  type MoneyPageDraft as Draft,
} from "@/lib/money-pages";
import { markMoneyPageApplied } from "@/services/money-pages-actions";

import { CopyField } from "./copy-field";

/**
 * One drafted money page, before beside after (SPEC-308).
 *
 * The three fields are copied out one at a time because that is how they go into Shopify
 * — Search engine listing has a title box and a description box, and the description is a
 * separate editor. A single "copy everything" button would produce one blob nobody can
 * paste anywhere.
 *
 * The page copy is shown as PLAIN TEXT, never rendered: it is HTML the shop stored and a
 * model wrote, and neither is a reason to run markup in the owner's browser.
 */
export function MoneyPageDraftView({
  draft,
  url,
  onApplied,
}: {
  draft: Draft;
  /** The live page, so the owner can see what they are changing. */
  url?: string;
  onApplied?: (draft: Draft) => void;
}) {
  const [applied, setApplied] = useState(draft.appliedAt !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = liveTitleOf(draft);

  async function handleApplied() {
    setBusy(true);
    setError(null);
    try {
      const next = await markMoneyPageApplied(draft.id, !applied);
      setApplied(next.appliedAt !== null);
      onApplied?.(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-1 p-4">
          <p className="text-sm text-foreground">{draft.why}</p>
          {draft.missed.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Written for: {draft.missed.slice(0, 5).map((m) => m.query).join(" · ")}
            </p>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              See the page as it is now
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          )}
        </CardContent>
      </Card>

      {/* Said once, where the copy buttons are — so nobody waits for a change that is
          theirs to make (backend SPEC-304 §The boundary). */}
      <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Search Visibility never changes your shop. Copy each field into the product in Shopify —
          the title and description go under <strong>Search engine listing</strong>, the
          page copy into the description editor.
        </span>
      </p>

      <Card>
        <CardContent className="space-y-6 p-4">
          <CopyField
            label="Search result title"
            value={draft.seoTitle}
            before={{ text: live.text, fallback: live.fallback }}
            limit={MAX_SEO_TITLE}
          />
          <CopyField
            label="Meta description"
            value={draft.metaDescription}
            before={{ text: draft.live.seoDescription ?? "", fallback: false }}
            limit={MAX_META_DESCRIPTION}
          />
          <CopyField
            label="Page description"
            value={draft.descriptionHtml}
            before={{ text: plainText(draft.live.bodyHtml), fallback: false }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <RoleButton
          need="spotlight.publish"
          variant={applied ? "outline" : "default"}
          onClick={handleApplied}
          disabled={busy}
        >
          {applied && <Check className="size-4" aria-hidden />}
          {applied ? "Pasted in — undo" : "I've pasted this in"}
        </RoleButton>
        {applied && (
          <span className="text-xs text-muted-foreground">
            Recorded here only — Shopify is unchanged until you save it there.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
