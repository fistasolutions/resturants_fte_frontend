"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISCONNECT_WORD, confirmsDisconnect } from "@/lib/finance-currency";

const REMOVED =
  "Its bills, payments, bank balances and Finance findings are removed from here, the access is revoked at Intuit, and the “Before Finance” baseline is rebuilt from the companies still connected.";

/**
 * Disconnecting books (SPEC-331), shared by the Finance Overview and the Integrations card
 * so both say exactly the same thing. One company: a plain confirmation that names it.
 * Every company: the list, and DISCONNECT typed before the button enables — the guard
 * enterprise tools put on an action that removes several sets of books at once.
 */
export function DisconnectOneDialog({
  company,
  onClose,
  onConfirm,
}: {
  company: { id: number; name: string } | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
}) {
  return (
    <AlertDialog open={company !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {company?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {REMOVED} <b>Nothing in QuickBooks changes</b> — it stays the system of record. You can connect the company
            again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              if (company) onConfirm(company.id);
              onClose();
            }}
          >
            Disconnect
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DisconnectAllDialog({
  open,
  companies,
  onClose,
  onConfirm,
}: {
  open: boolean;
  companies: string[];
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [typed, setTyped] = useState("");
  const [working, setWorking] = useState(false);
  const ready = confirmsDisconnect(typed);

  function close() {
    setTyped("");
    onClose();
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !working && close()}>
      <AlertDialogContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!ready || working) return;
            setWorking(true);
            const done = await onConfirm();
            setWorking(false);
            if (done) close();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect all {companies.length} companies?</AlertDialogTitle>
            <AlertDialogDescription>
              Each company is disconnected exactly as on its own: every one&rsquo;s bills, payments, bank balances and
              Finance findings are removed from here and each access is revoked at Intuit. <b>Nothing in QuickBooks
              changes.</b> Accounts Payable stops until a company is connected again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
            {companies.map((name) => (
              <li key={name} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
                {name}
              </li>
            ))}
          </ul>
          <div className="space-y-1.5">
            <Label htmlFor="disconnect-all-confirm">
              Type <span className="font-mono font-semibold">{DISCONNECT_WORD}</span> to confirm
            </Label>
            <Input
              id="disconnect-all-confirm"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              aria-describedby="disconnect-all-hint"
            />
            <p id="disconnect-all-hint" className="text-[11px] text-muted-foreground">
              To disconnect only one company, use the × beside its name instead.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={working}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!ready || working}>
              {working ? "Disconnecting…" : `Disconnect all ${companies.length}`}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
