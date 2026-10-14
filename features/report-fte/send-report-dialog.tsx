"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";

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
import { RecipientPicker } from "@/features/report-fte/recipient-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { initialRecipients } from "@/lib/report-fte-delivery";
import { reportFteQueries } from "@/lib/queries/report-fte";
import type { SendResult } from "@/types/report-fte";

/**
 * Approve & send (SPEC-335): the owner's address prefilled (or a scheduled run's own
 * people), editable, every Settings address one tick away, then Send. A failure stays
 * here so nothing is lost.
 */
export function SendReportDialog({
  open,
  onOpenChange,
  title,
  formats,
  scheduledRecipients,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formats: string;
  scheduledRecipients: string[] | null | undefined;
  onSend: (to: string[]) => Promise<SendResult>;
}) {
  const directory = useApiQuery(open ? reportFteQueries.recipients() : null);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = chosen ?? initialRecipients(directory.data?.default ?? [], scheduledRecipients);

  async function send() {
    setSending(true);
    setError(null);
    try {
      await onSend(value);
      onOpenChange(false);
      setChosen(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sending failed.");
    }
    setSending(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!sending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send “{title}”</DialogTitle>
          <DialogDescription>
            Approve this report and email it now. Everyone below gets the same report{formats ? ` with ${formats}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="send-to">Send to</Label>
          <RecipientPicker
            id="send-to"
            value={value}
            onChange={setChosen}
            options={directory.data?.items ?? []}
            loading={directory.isPending}
          />
          {directory.isError ? (
            <p className="text-xs text-muted-foreground">
              The saved addresses couldn&rsquo;t load — you can still type an address.
            </p>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => void send()} disabled={sending || value.length === 0}>
            {sending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {sending ? "Sending…" : `Send to ${value.length} ${value.length === 1 ? "person" : "people"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
