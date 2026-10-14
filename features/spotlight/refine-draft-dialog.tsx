"use client";


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
import { GlispIcon } from "@/components/shared/glisp-icon";

/**
 * The refine modal (SPEC-117, backend SPEC-113): a controlled shadcn `Dialog`
 * with a `Textarea` prefilled with the draft's current brief. On Regenerate the
 * parent closes it and replaces the article with the SAME staged progress
 * animation a new blog shows (SPEC-151 — the harness discards intermediate
 * drafts, so no live token typing), then refreshes to the finished draft. A
 * failed rewrite reopens this modal with the message + the typed instruction
 * intact, so the draft is never lost.
 */
export function RefineDraftDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onRegenerate,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onRegenerate: () => void;
  error: string | null;
}) {
  const canSubmit = value.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request changes</DialogTitle>
          <DialogDescription>
            Tell the writer what to change. Search Visibility rewrites the draft grounded
            in your Brand Brain and shows its progress as it works.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label
            htmlFor="refine-prompt"
            className="text-sm font-medium text-foreground"
          >
            Your instructions
          </label>
          <Textarea
            id="refine-prompt"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            rows={5}
            autoFocus
            placeholder="e.g. Make the intro punchier and add a short section on layering for winter."
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onRegenerate} disabled={!canSubmit}>
            <GlispIcon className="size-4" aria-hidden />
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
