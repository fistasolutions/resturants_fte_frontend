"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { REFINE_SUGGESTIONS, refineInstructionError } from "@/lib/social-post";
import { GlispIcon } from "@/components/shared/glisp-icon";

/**
 * The Refine modal (SPEC-144) — a controlled shadcn `Dialog` mirroring Spotlight's
 * `RefineDraftDialog`. The owner types (or picks a suggestion chip that pre-fills)
 * what to change; on Refine the parent calls the backend and, on success, updates
 * the post detail in place. A failed refine keeps this open with the message + the
 * typed instruction intact. Closing is blocked while a refine is in flight.
 */
export function RefinePostDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onRefine,
  refining,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onRefine: () => void;
  refining: boolean;
  error: string | null;
}) {
  const canSubmit = refineInstructionError(value) === null;

  return (
    <Dialog
      open={open}
      // Ignore close attempts while a refine is running so the loading state isn't lost.
      onOpenChange={(next) => {
        if (refining) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refine this post</DialogTitle>
          <DialogDescription>
            Tell the writer what to change. It rewrites the caption and hooks,
            grounded in your Brand Brain.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="refine-post-prompt"
              className="text-sm font-medium text-foreground"
            >
              What would you like to change?
            </label>
            <Textarea
              id="refine-post-prompt"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              rows={5}
              autoFocus
              disabled={refining}
              placeholder="e.g. Lead with the occasion and make the first line punchier."
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REFINE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={refining}
                onClick={() => onValueChange(suggestion)}
                className={cn(
                  "inline-flex h-7 items-center rounded-4xl border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={refining}
          >
            Cancel
          </Button>
          <Button onClick={onRefine} disabled={!canSubmit || refining}>
            {refining ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Refining…
              </>
            ) : (
              <>
                <GlispIcon className="size-4" aria-hidden />
                Refine
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
