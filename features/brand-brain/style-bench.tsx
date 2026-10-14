"use client";

import { useState } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { brandBrainPaths } from "@/lib/queries/brand-brain";
import { surfaceLabel, testCaption } from "@/lib/style-bench";
import { cn } from "@/lib/utils";
import type { StyleSurface, StyleTest } from "@/types/brand-brain";
import { relativeTime } from "@/lib/system-trace";

/**
 * The bench (frontend SPEC-297 / backend SPEC-292): make one picture with today's rules
 * and keep the last five, each with the prompt it was made from. The rules say what the
 * brand wants; this says what the model does with them.
 */
export function StyleBench({
  tests,
  surface,
  busy,
  error,
  onGenerate,
  onDelete,
}: {
  tests: StyleTest[];
  surface: StyleSurface;
  busy: boolean;
  error: string | null;
  onGenerate: (brief: string) => void;
  onDelete: (test: StyleTest) => void;
}) {
  const [brief, setBrief] = useState("");
  const [open, setOpen] = useState<StyleTest | null>(null);

  return (
    <Card className="gap-0 p-0" data-style-bench>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <p className="text-sm font-semibold">Test it</p>
        <p className="text-xs text-muted-foreground">
          {surfaceLabel(surface)} · the last 5 renders are kept
        </p>
      </div>

      <form
        className="grid grid-cols-[1fr_auto] gap-2 px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          onGenerate(brief.trim());
        }}
      >
        <Input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="optional — the scene to try, e.g. on a stone ledge in winter light"
          aria-label="Test brief"
          disabled={busy}
        />
        <RoleButton need="brand_brain.manage" type="submit" size="sm" disabled={busy} data-style-generate>
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          <span className={busy ? "ml-1.5" : undefined}>{busy ? "Rendering…" : "Generate"}</span>
        </RoleButton>
      </form>

      {error ? <p className="px-5 pb-3 text-sm text-destructive">{error}</p> : null}

      {tests.length === 0 && !busy ? (
        <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">
          Nothing rendered yet. A test uses a real best-selling product and the rules above —
          the same path a blog header or a social post takes — so what you see here is what
          the next picture will look like.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-5">
          {busy ? (
            <li className="flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </li>
          ) : null}
          {tests.map((test) => (
            <li key={test.id} className="group relative">
              <button
                type="button"
                onClick={() => setOpen(test)}
                className="block w-full overflow-hidden rounded-xl border border-border transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Open the render: ${testCaption(test)}`}
                data-style-tile
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/proxy${brandBrainPaths.styleTestImage(test.id)}`}
                  alt={testCaption(test)}
                  className="aspect-[4/5] w-full bg-secondary object-cover"
                  loading="lazy"
                />
              </button>
              <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {testCaption(test)}
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                {surfaceLabel(test.surface)}
                {test.createdAt ? ` · ${relativeTime(test.createdAt)}` : ""}
              </p>
              <RoleGate need="brand_brain.manage">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className={cn(
                  "absolute top-1.5 right-1.5 size-6 opacity-0 transition-opacity",
                  "group-hover:opacity-100 focus-visible:opacity-100",
                )}
                aria-label={`Remove the render: ${testCaption(test)}`}
                onClick={() => onDelete(test)}
              >
                <X className="size-3" aria-hidden />
              </Button>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open !== null} onOpenChange={(next) => (next ? null : setOpen(null))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
              {open ? testCaption(open) : ""}
            </DialogTitle>
          </DialogHeader>
          {open ? (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/proxy${brandBrainPaths.styleTestImage(open.id)}`}
                alt={testCaption(open)}
                className="w-full rounded-lg border border-border bg-secondary object-contain"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {surfaceLabel(open.surface)} · {open.rulesCount} rules in force
                  {open.productTitle ? ` · ${open.productTitle}` : ""}
                </p>
                <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  The prompt it was made from
                </p>
                <pre className="scrollbar-subtle mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-border bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {open.prompt.trim()}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
