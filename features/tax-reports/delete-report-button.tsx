"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";

/**
 * Delete one generated report (SPEC-166 Patches).
 *
 * Deliberately worded to say what it does and does not touch: the report is a
 * generated artefact, and removing it leaves orders, tax lines and refunds
 * untouched, so the same period can be regenerated and will reproduce identical
 * figures. That matters because the client asked to *retain* report history —
 * this is for clearing reports produced during validation, not for discarding
 * accounting records.
 */
export function DeleteReportButton({
  reportId,
  periodLabel,
}: {
  reportId: number;
  periodLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    // Hold the dialog open until the request resolves so an error stays visible.
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/tax-reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Could not delete (${response.status}).`);
      }
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete — try again.");
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <RoleGate need="tax_reports.manage">
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete the ${periodLabel} report`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </AlertDialogTrigger>
      </RoleGate>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the {periodLabel} report?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the generated report and its Excel file. Your Shopify data is
            not touched, so this period can be regenerated at any time and will produce
            the same figures.
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
            {busy ? "Deleting…" : "Delete report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
