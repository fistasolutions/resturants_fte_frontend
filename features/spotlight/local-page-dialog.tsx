"use client";

import { useState } from "react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/restaurant/parts";
import { editErrors, lengthHint, type LocalPageField } from "@/lib/local-pages";
import { cn } from "@/lib/utils";
import { editLocalPage } from "@/services/local-pages-actions";
import type { LocalPage, LocalPagesData } from "@/types/local-pages";

const FIELDS: { key: LocalPageField; label: string; multiline?: boolean }[] = [
  { key: "headline", label: "Headline" },
  { key: "intro", label: "Intro", multiline: true },
  { key: "seoTitle", label: "Search title" },
  { key: "seoDescription", label: "Search description", multiline: true },
];

/** Edit a branch's local page (SPEC-386). Lengths are counted as you type. */
export function LocalPageDialog({
  branchId,
  branchName,
  page,
  open,
  onOpenChange,
  onSaved,
}: {
  branchId: number;
  branchName: string;
  page: LocalPage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (data: LocalPagesData) => void;
}) {
  const [values, setValues] = useState<Record<LocalPageField, string>>({
    headline: page.headline,
    intro: page.intro,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problems = editErrors(values);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await editLocalPage(branchId, values));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit the page · {branchName}</DialogTitle>
          <DialogDescription>
            The address, hours, phone and menu prices come from the branch itself; this is the copy above them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {FIELDS.map((field) => {
            const hint = lengthHint(values[field.key], field.key);
            const id = `local-page-${field.key}`;
            const Control = field.multiline ? Textarea : Input;
            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={id}>{field.label}</Label>
                  <span className={cn("text-xs tabular-nums", hint.over ? "text-destructive" : "text-muted-foreground")}>
                    {hint.text}
                  </span>
                </div>
                <Control
                  id={id}
                  value={values[field.key]}
                  rows={field.key === "intro" ? 6 : 2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
              </div>
            );
          })}
        </div>
        <FormError message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <RoleButton need={["spotlight.manage"]} disabled={busy || problems.length > 0} onClick={() => void save()}>
            Save
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
