"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailPreview } from "@/features/email-marketing/email-preview";
import { VoiceCheckCard } from "@/features/email-marketing/voice-check-card";
import type { FlowMessage } from "@/lib/email-flow-layout";
import type { AdviceBlock, CatalogProduct, VoiceRules } from "@/types/email-marketing";

/** One message of a flow, opened (SPEC-345): its preview in four views, the brand-voice
 * check, and its subject and preview text to edit. */
export function FlowMessageDialog({
  message,
  catalog,
  voice,
  fromName,
  advice,
  busy,
  onClose,
  onSave,
}: {
  message: FlowMessage | null;
  catalog: CatalogProduct[];
  voice: VoiceRules;
  fromName: string;
  /** The store's advice block, so the preview marks it for the store's trade (SPEC-364). */
  advice?: AdviceBlock;
  busy: boolean;
  onClose: () => void;
  onSave: (subject: string, previewText: string) => void;
}) {
  const [subject, setSubject] = useState(message?.subject ?? "");
  const [preview, setPreview] = useState(message?.previewText ?? "");
  if (!message) return null;
  const changed = subject !== message.subject || preview !== message.previewText;
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{message.label}: {message.subject}</DialogTitle>
          <DialogDescription>Edits save to the flow as a draft message; a live flow keeps sending the old version until you turn the change on.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="flow-subject">Subject</Label>
            <Input id="flow-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="flow-preview">Preview text</Label>
            <Input id="flow-preview" value={preview} onChange={(e) => setPreview(e.target.value)} />
          </div>
        </div>
        <VoiceCheckCard text={[subject, preview, ...message.blocks.flatMap((b) => [b.title, b.body])].join(". ")} rules={voice} />
        <EmailPreview message={{ channel: message.channel, subject, previewText: preview, blocks: message.blocks, templateId: null }} catalog={catalog} fromName={fromName} advice={advice} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button disabled={busy || !changed || subject.trim().length === 0} onClick={() => onSave(subject.trim(), preview.trim())}>Save message</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
