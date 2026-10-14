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

/** Asks for a reason before a decision that needs one — sending a draft back (10+ characters,
 * the CI Plans shape). The box names what is missing; the button stays off until it is there. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  confirmLabel,
  minLength = 10,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  confirmLabel: string;
  minLength?: number;
  onConfirm: (reason: string) => void;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  const short = reason.trim().length < minLength;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (short) return;
            onConfirm(reason.trim());
            setReason("");
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Textarea id={id} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} autoFocus />
            <p className={short ? "text-xs text-muted-foreground" : "text-xs text-success"}>
              {short ? `At least ${minLength} characters — ${Math.max(0, minLength - reason.trim().length)} to go.` : "Ready."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={short}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
