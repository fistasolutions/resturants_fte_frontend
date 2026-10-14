"use client";

import { useState } from "react";
import Link from "next/link";

import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { EmptyLine, NUM, Section, TD, TH } from "@/features/finance/finance-ui";
import { financeBillHref, shortDate } from "@/lib/finance";
import {
  KIND_LABEL,
  LEDGER_FILTERS,
  dismissReasonError,
  filterLedger,
  ledgerCounts,
  rowAmount,
  statusLabel,
  valueHref,
  verifiedLabel,
  type LedgerFilter,
} from "@/lib/finance-value";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types/finance";
import { formatCurrency } from "@/utils/format";

/**
 * The ledger (SPEC-330): one row per thing Finance caught, and what became of it — every
 * figure on the tab above is a sum of these rows. Open rows come first because they need
 * a decision; a manager can clear one ("not a problem", with a reason) or restore it.
 */
export function ValueLedger({
  rows,
  filter,
  month,
  editable,
  pending,
  onDismiss,
  onRestore,
}: {
  rows: Finding[];
  filter: LedgerFilter;
  month: string | null;
  editable: boolean;
  pending: string | null;
  onDismiss: (id: number, reason: string) => Promise<boolean>;
  onRestore: (id: number) => Promise<boolean>;
}) {
  const [clearing, setClearing] = useState<Finding | null>(null);
  const counts = ledgerCounts(rows);
  const shown = filterLedger(rows, filter);

  return (
    <Section
      title="The ledger"
      meta={`${rows.length} ${rows.length === 1 ? "finding" : "findings"} · open and decided this month`}
      actions={
        <span role="group" aria-label="Filter the ledger" className="flex flex-wrap gap-1">
          {LEDGER_FILTERS.map((f) => (
            <ShallowLink
              key={f.key}
              href={valueHref(month, f.key)}
              aria-current={f.key === filter ? "true" : undefined}
              className={cn(
                "rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                f.key === filter && "border-foreground text-foreground",
              )}
            >
              {f.label} <span className="tabular-nums">{counts[f.key]}</span>
            </ShallowLink>
          ))}
        </span>
      }
    >
      {shown.length === 0 ? (
        <EmptyLine>
          {rows.length === 0
            ? "Nothing caught yet. Every early-pay discount and possible duplicate Finance sees lands here, with what became of it."
            : "Nothing in this view."}
        </EmptyLine>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className={TH}>What</th>
                <th className={TH}>Vendor · bill</th>
                <th className={TH}>Company</th>
                <th className={cn(TH, "text-right")}>Amount</th>
                <th className={TH}>Status</th>
                <th className={TH}>How we know</th>
                <th className={TH}>Date</th>
                <th className={cn(TH, "text-right")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <LedgerRow
                  key={row.id ?? `row-${index}`}
                  row={row}
                  editable={editable}
                  pending={pending}
                  onClear={() => setClearing(row)}
                  onRestore={onRestore}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ClearDialog
        finding={clearing}
        busy={clearing?.id != null && pending === `dismiss-${clearing.id}`}
        onClose={() => setClearing(null)}
        onConfirm={async (reason) => {
          if (clearing?.id == null) return;
          if (await onDismiss(clearing.id, reason)) setClearing(null);
        }}
      />
    </Section>
  );
}

function LedgerRow({
  row,
  editable,
  pending,
  onClear,
  onRestore,
}: {
  row: Finding;
  editable: boolean;
  pending: string | null;
  onClear: () => void;
  onRestore: (id: number) => Promise<boolean>;
}) {
  const status = statusLabel(row.kind, row.status);
  const verified = verifiedLabel(row.verified);
  const date = row.resolvedOn ?? row.deadline ?? row.firstSeen;
  const dateLabel = row.resolvedOn ? "" : row.deadline && row.status === "open" ? "by " : "seen ";
  const canAct = editable && row.id != null && row.id > 0;
  return (
    <tr className="border-t border-border align-top">
      <td className={TD}>
        <span className="font-medium">{KIND_LABEL[row.kind]}</span>
        {row.otherCompany && (
          <span className="block text-[11px] text-muted-foreground">Also entered in {row.otherCompany}</span>
        )}
      </td>
      <td className={TD}>
        {row.billId ? (
          <Link prefetch={false} href={financeBillHref({ id: row.billId })} className="font-medium underline-offset-2 hover:underline">
            {row.vendor}
          </Link>
        ) : (
          <span className="font-medium">{row.vendor}</span>
        )}
        {row.number && <span className="block text-[11px] text-muted-foreground">{row.number}</span>}
      </td>
      <td className={cn(TD, "text-muted-foreground")}>{row.company}</td>
      <td className={cn(TD, NUM, "font-semibold")}>{formatCurrency(rowAmount(row))}</td>
      <td className={TD}>
        <StatusBadge tone={status.tone}>{status.text}</StatusBadge>
      </td>
      <td className={cn(TD, "max-w-72 whitespace-normal text-xs text-muted-foreground")}>
        {row.status === "dismissed" && row.dismissReason ? `Cleared: ${row.dismissReason}` : (verified ?? row.note ?? "—")}
      </td>
      <td className={cn(TD, "text-xs text-muted-foreground tabular-nums")}>
        {date ? `${dateLabel}${shortDate(date)}` : "—"}
      </td>
      <td className={cn(TD, "text-right")}>
        {canAct && row.status === "open" && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Not a problem
          </Button>
        )}
        {canAct && row.status === "dismissed" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending === `restore-${row.id}`}
            onClick={() => void onRestore(row.id as number)}
          >
            {pending === `restore-${row.id}` ? "Restoring…" : "Restore"}
          </Button>
        )}
      </td>
    </tr>
  );
}

function ClearDialog({
  finding,
  busy,
  onClose,
  onConfirm,
}: {
  finding: Finding | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const error = dismissReasonError(reason);
  const open = finding != null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setReason("");
          setTouched(false);
          onClose();
        }
      }}
    >
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (!error) void onConfirm(reason.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Not a problem?</DialogTitle>
            <DialogDescription>
              {finding?.kind === "duplicate"
                ? "Finance stops flagging both copies, and the payment run includes the bill again. You can restore it later."
                : "Finance stops counting this discount as at stake. You can restore it later."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="finding-reason">Why</Label>
            <Textarea
              id="finding-reason"
              value={reason}
              maxLength={200}
              placeholder="e.g. Two real deliveries, same amount"
              aria-invalid={touched && error != null}
              aria-describedby={touched && error ? "finding-reason-error" : undefined}
              onChange={(event) => setReason(event.target.value)}
            />
            {touched && error && (
              <p id="finding-reason-error" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Clear it"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
