"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import { deleteDraft } from "@/services/spotlight-actions";

interface DeleteDraftButtonProps {
  draftId: number;
  /** Optimistic list removal: fires once the delete succeeds. When omitted the
   *  button navigates to `/spotlight?tab=inbound` instead (the detail page). */
  onDeleted?: (id: number) => void;
  /** Accessible label / tooltip for the trigger (defaults to a generic phrase). */
  label?: string;
  /** Trigger button size — `icon-xs` on list rows, `sm` on the detail page. */
  size?: "icon-xs" | "sm";
  className?: string;
}

/** Delete control (SPEC-112): a trash trigger gated by a confirm dialog. On the
 *  lists it removes the row optimistically via `onDeleted`; on the blog-detail
 *  page it navigates back to the drafts list. Errors surface inline in the
 *  dialog and the row/page is left intact so the user can retry. */
export function DeleteDraftButton({
  draftId,
  onDeleted,
  label = "Delete draft",
  size = "icon-xs",
  className,
}: DeleteDraftButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const can = useCan();

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the request resolves so an error stays visible.
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await deleteDraft(draftId);
      setOpen(false);
      if (onDeleted) {
        onDeleted(draftId);
      } else {
        router.push("/spotlight?tab=inbound");
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete — try again.");
      setBusy(false);
    }
  }

  // A list row's trash icon is a secondary action: hidden for a role that can't delete.
  // The detail page's button stays, disabled with the reason (SPEC-358).
  if (size !== "sm" && !can("spotlight.manage").allowed) return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        {size === "sm" ? (
          <RoleButton
            need="spotlight.manage"
            variant="outline"
            size="sm"
            aria-label={label}
            className={cn(
              "text-muted-foreground hover:text-destructive",
              className,
            )}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </RoleButton>
        ) : (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            className={cn(
              "shrink-0 text-muted-foreground hover:text-destructive",
              className,
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the draft and its grounding. This can&apos;t
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : "Delete draft"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
