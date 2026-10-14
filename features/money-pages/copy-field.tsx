"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { lengthState } from "@/lib/money-pages";
import { cn } from "@/lib/utils";

/**
 * One field of a money-page draft: the new copy, how it sits against Google's limit, and
 * the button that puts it on the clipboard (SPEC-308).
 *
 * Copying is the whole interaction — the owner pastes it into Shopify themselves — so the
 * button confirms rather than staying silent, and the counter is shown even when the text
 * is comfortably short, because "how long is this allowed to be" is the question a person
 * writing a title always has.
 */
export function CopyField({
  label,
  value,
  before,
  limit,
}: {
  label: string;
  value: string;
  /** What is live today, shown above the new copy. */
  before?: { text: string; fallback?: boolean } | null;
  /** Google's length limit, when the field has one. */
  limit?: number;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // A blocked clipboard is not an error worth a dialog — the text is on screen and
      // selectable, which is the fallback every browser still allows.
      setCopied(false);
    }
  }

  const state = limit ? lengthState(value, limit) : "ok";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <div className="flex items-center gap-2">
          {limit && (
            <span
              className={cn(
                "text-xs tabular-nums",
                state === "over"
                  ? "text-destructive"
                  : state === "tight"
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            >
              {value.length}/{limit}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={handleCopy} aria-live="polite">
            {copied ? (
              <Check className="size-3.5 text-success" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      {before && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Live now{before.fallback ? " (Shopify falls back to the page title)" : ""}
          </p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            {before.text || "— nothing set —"}
          </p>
        </div>
      )}
      <div className="rounded-md border border-border bg-card px-3 py-2">
        <p className="text-sm break-words whitespace-pre-wrap text-foreground">{value}</p>
      </div>
    </div>
  );
}
