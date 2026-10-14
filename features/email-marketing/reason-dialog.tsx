"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Asks for a reason before a decision that needs one (SPEC-345): rejecting a plan slot or
 * an approval, sending work back, pulling the kill switch. The confirm stays disabled until
 * the reason is long enough, and the minimum is stated, never discovered.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  confirmLabel,
  minLength,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  confirmLabel: string;
  minLength: number;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  const short = reason.trim().length < minLength;

  function close(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (short) return;
            onConfirm(reason.trim());
            close(false);
          }}
        >
          <Label htmlFor={id}>{label}</Label>
          <Textarea id={id} value={reason} rows={3} onChange={(event) => setReason(event.target.value)} autoFocus />
          <p className="text-xs text-muted-foreground">At least {minLength} characters.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={short}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
