"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, PenLine, Search } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  basisLabel,
  positionLabel,
  valueLabel,
  type MoneyPage,
  type MoneyPageDraft as Draft,
} from "@/lib/money-pages";
import { moneyPagePaths } from "@/lib/queries/money-pages";
import { cn } from "@/lib/utils";
import { clientApi } from "@/lib/client-api";
import { adaptMoneyPageDraft } from "@/lib/money-pages";
import { writeMoneyPage } from "@/services/money-pages-actions";
import { formatNumber } from "@/utils/format";

import { MoneyPageDraftView } from "./money-page-draft";

/**
 * One money page (SPEC-308): what it is, what it would be worth, what it is shown for,
 * and the button that writes it.
 *
 * The draft opens inline rather than on its own route: the owner is comparing this page
 * against the others while deciding what to spend an afternoon on, and a navigation would
 * lose that list. Reading an existing draft is a lazy fetch on expand — the list itself
 * carries only whether one exists.
 */
export function MoneyPageRow({ page }: { page: MoneyPage }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWrite() {
    setBusy(true);
    setError(null);
    try {
      setDraft(await writeMoneyPage(page.kind, page.pageId));
      setOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not write that page.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen() {
    if (draft) {
      setOpen((current) => !current);
      return;
    }
    if (!page.draft) return;
    setBusy(true);
    setError(null);
    try {
      const raw = await clientApi<Record<string, unknown>>(moneyPagePaths.draft(page.draft.id));
      setDraft(adaptMoneyPageDraft(raw));
      setOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open that draft.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {page.kind === "collection" ? "Collection" : "Product"}
              </span>
              {page.unwritten && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                  No search copy
                </span>
              )}
              {page.draft && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                  {page.draft.appliedAt ? "Pasted in" : "Drafted"}
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-foreground">
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-1 hover:underline"
              >
                {page.title || page.handle}
                <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </a>
            </h3>
            <p className="text-xs text-muted-foreground">{positionLabel(page)}</p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                page.value === null ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {valueLabel(page)}
            </p>
            <p className="text-xs text-muted-foreground">
              +{formatNumber(Math.round(page.potentialClicks))} visits a month
            </p>
            {basisLabel(page) && (
              <p className="text-xs text-muted-foreground">{basisLabel(page)}</p>
            )}
          </div>
        </div>

        {page.searches.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {page.searches.slice(0, 5).map((search) => (
              <li
                key={search.query}
                className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
              >
                <Search className="size-3" aria-hidden />
                {search.query}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {page.draft || draft ? (
            <Button size="sm" variant="outline" onClick={handleOpen} disabled={busy}>
              <ChevronDown
                className={cn("size-3.5 transition-transform", open && "rotate-180")}
                aria-hidden
              />
              {open ? "Hide the draft" : busy ? "Opening…" : "Open the draft"}
            </Button>
          ) : null}
          <RoleButton
            need="spotlight.manage"
            size="sm"
            variant={page.draft ? "ghost" : "outline"}
            onClick={handleWrite}
            disabled={busy}
          >
            <PenLine className={busy ? "size-3.5 animate-pulse" : "size-3.5"} aria-hidden />
            {busy ? "Writing…" : page.draft ? "Write it again" : "Write it"}
          </RoleButton>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        {open && draft && (
          <div className="border-t border-border pt-4">
            <MoneyPageDraftView draft={draft} url={page.url} onApplied={setDraft} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
