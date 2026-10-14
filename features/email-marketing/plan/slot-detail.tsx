"use client";

import { useId, useState } from "react";
import { Check, PenLine, X } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmLink } from "@/features/email-marketing/em-link";
import { builderHref, formatMoney } from "@/lib/email-marketing";
import { parseIsoDate, REASON_LABELS } from "@/lib/email-plan";
import type { PlanSlot } from "@/types/email-marketing";

/** One slot, opened (SPEC-345): why it is there, who it is for, what it should make, and the
 * three decisions — accept, reject with a reason, move to another day. */
export function SlotDetail({
  slot,
  today,
  busy,
  onAccept,
  onReject,
  onMove,
  onClose,
}: {
  slot: PlanSlot;
  today: string;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onMove: (date: string) => void;
  onClose: () => void;
}) {
  const dateId = useId();
  const [date, setDate] = useState(slot.date);
  return (
    <aside className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label={`Plan slot: ${slot.title}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
            {slot.kind === "campaign" ? "Campaign" : "Flow change"} · {REASON_LABELS[slot.reasonKind]}
          </p>
          <h3 className="mt-1 font-semibold text-foreground">{slot.title}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">When</dt>
        <dd>{parseIsoDate(slot.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</dd>
        <dt className="text-muted-foreground">Why</dt>
        <dd>{slot.reason}</dd>
        <dt className="text-muted-foreground">Audience</dt>
        <dd>{slot.audience}</dd>
        <dt className="text-muted-foreground">Expected</dt>
        <dd>≈ {formatMoney(slot.expectedProfit)} profit</dd>
        <dt className="text-muted-foreground">State</dt>
        <dd>
          <StatusBadge tone={slot.state === "accepted" ? "success" : "neutral"}>{slot.state === "accepted" ? "Accepted" : "Proposed"}</StatusBadge>
        </dd>
      </dl>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (date !== slot.date) onMove(date);
        }}
      >
        <div className="flex-1 space-y-1">
          <Label htmlFor={dateId}>Move to</Label>
          <Input id={dateId} type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={busy || date === slot.date || date < today}>
          Move
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {slot.state !== "accepted" ? (
          <Button size="sm" disabled={busy} onClick={onAccept}>
            <Check aria-hidden />
            Accept
          </Button>
        ) : null}
        <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>
          Reject…
        </Button>
        {slot.kind === "campaign" && slot.goal ? (
          <EmLink href={builderHref({ goal: slot.goal, from: slot.id })} className={buttonVariants({ size: "sm", variant: "ghost" })}>
            <PenLine aria-hidden />
            Build it now
          </EmLink>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Accepting puts it in the plan; it still waits for your approval before it sends.</p>
    </aside>
  );
}
