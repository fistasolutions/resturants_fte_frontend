"use client";

import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The "Mark as posted" modal (SPEC-168) — the manual half of the publish loop.
 *
 * The owner posts to Instagram or Facebook by hand, then records it here so the
 * post stops sitting in the queue forever and the Calendar tells the truth. The
 * link is optional (recording *that* it went out matters more than *where*), but
 * supplying it turns the post card into a live "View post" link.
 *
 * Controlled, like `RefinePostDialog`: closing is blocked while the request is in
 * flight so the loading state can't be lost, and a failure keeps the dialog open
 * with the message and the typed link intact.
 */
export function MarkPostedDialog({
  open,
  onOpenChange,
  link,
  onLinkChange,
  onConfirm,
  saving,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string;
  onLinkChange: (value: string) => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as posted</DialogTitle>
          <DialogDescription>
            Records that you published this yourself, so it leaves the queue and
            shows as posted on the calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="mark-posted-link">Link to the post (optional)</Label>
          <Input
            id="mark-posted-link"
            type="url"
            inputMode="url"
            placeholder="https://instagram.com/p/…"
            value={link}
            disabled={saving}
            onChange={(event) => onLinkChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !saving) {
                event.preventDefault();
                onConfirm();
              }
            }}
            aria-describedby={error ? "mark-posted-error" : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p
              id="mark-posted-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Mark as posted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
