"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RoleButton } from "@/components/shared/role-gate";
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
import { FormError } from "@/features/restaurant/parts";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import { importBranches } from "@/services/restaurant-actions";
import type { BranchImportReport } from "@/types/restaurant";

function Summary({ report }: { report: BranchImportReport }) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium text-foreground">
        {report.dryRun ? "If you import this file:" : "Imported:"} {report.created} new, {report.updated} updated,{" "}
        {report.unchanged} unchanged
        {report.newFranchisees ? `, ${report.newFranchisees} new franchisee${report.newFranchisees === 1 ? "" : "s"}` : ""}
        {report.newRegions ? `, ${report.newRegions} new region${report.newRegions === 1 ? "" : "s"}` : ""}.
      </p>
      {report.unmapped.length ? (
        <p className="text-xs text-muted-foreground">Columns not used: {report.unmapped.join(", ")}</p>
      ) : null}
      {report.errors.length ? (
        <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
          {report.errors.map((e) => (
            <li key={`${e.row}-${e.message}`}>
              Row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Import branches from a spreadsheet — a dry run first, then the real thing (backend SPEC-387). */
export function BranchImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<BranchImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await importBranches(file, dryRun);
      setReport(result);
      if (!dryRun) await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Importing the branches failed.");
    } finally {
      setBusy(false);
    }
  };

  const close = (next: boolean) => {
    if (!next) {
      setFile(null);
      setReport(null);
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import branches</DialogTitle>
          <DialogDescription>
            One row per branch. Columns: store number and name (required); franchisee, region, POS store id, status,
            address, city, state, postal code, phone, timezone, opened on, manager, manager email. Franchisees and
            regions are created by name; an existing store number is updated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="branch-file">CSV file</Label>
          <Input
            id="branch-file"
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReport(null);
            }}
          />
        </div>
        {report ? <Summary report={report} /> : null}
        <FormError message={error} />
        <DialogFooter>
          <Button type="button" variant="outline" disabled={!file || busy} onClick={() => void run(true)}>
            Check the file
          </Button>
          <RoleButton
            need={["network.manage"]}
            disabled={!file || busy || !report?.dryRun}
            onClick={() => void run(false)}
          >
            {busy ? "Working…" : "Import"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
