"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/restaurant/parts";
import { formatCodeInput, isCompleteCode } from "@/lib/loyalty";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import { changeDue } from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { reloadGiftCard, sellGiftCard } from "@/services/restaurant-os-actions";
import type { GiftCardSale } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

type Mode = "sell" | "reload";

/** Sell or reload a gift card at the counter (SPEC-383). The new card's code is shown once. */
export function GiftCardDialog({ branchId, onClose }: { branchId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("sell");
  const [amount, setAmount] = useState("25");
  const [method, setMethod] = useState<"cash" | "card_present">("cash");
  const [given, setGiven] = useState("");
  const [code, setCode] = useState("");
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<GiftCardSale | null>(null);
  const [copied, setCopied] = useState(false);
  const value = Number(amount);
  const change = method === "cash" && given.trim() ? changeDue(value, given) : null;
  const valid =
    value >= 5 &&
    value <= 500 &&
    (method !== "cash" || !given.trim() || change != null) &&
    (mode === "sell" || isCompleteCode(code));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const tender = { method, amountTendered: method === "cash" && given.trim() ? Number(given) : null };
    try {
      const result =
        mode === "sell"
          ? await sellGiftCard({ branchId, amount: value, tender, recipientName: recipient.trim() || null, recipientEmail: email.trim() || null })
          : await reloadGiftCard({ branchId, amount: value, tender, code });
      setDone(result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "gift-cards"] }),
        queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "cash", branchId] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!done?.code) return;
    try {
      await navigator.clipboard.writeText(done.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "sell" ? "Sell a gift card" : "Reload a gift card"}</DialogTitle>
          <DialogDescription>A gift card is money held for the guest; it counts as sales when it is spent.</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-3">
            {done.code ? (
              <>
                <p className="text-sm text-muted-foreground">Write this code on the card or give it to the guest. It is shown only now.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-center text-lg font-bold tracking-widest text-foreground">{done.code}</code>
                  <Button variant="outline" size="sm" onClick={() => void copy()} aria-label="Copy the code">
                    <Copy aria-hidden /> {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </>
            ) : null}
            <p className="text-sm text-foreground">
              Card ···{done.card.last4} now holds <span className="font-semibold">{formatCurrency(done.card.balance)}</span>
              {done.changeDue ? ` · change ${formatCurrency(done.changeDue)}` : ""}.
            </p>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Sell or reload">
              {(["sell", "reload"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mode === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "sell" ? "New card" : "Reload a card"}
                </button>
              ))}
            </div>
            {mode === "reload" ? (
              <div className="space-y-1">
                <Label htmlFor="gc-code">Card code</Label>
                <Input id="gc-code" value={code} onChange={(e) => setCode(formatCodeInput(e.target.value))} placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gc-amount">Amount (5–500)</Label>
                <Input id="gc-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label>Paid with</Label>
                <div className="flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Paid with">
                  {(["cash", "card_present"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        method === m ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {m === "cash" ? "Cash" : "Card"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {method === "cash" ? (
              <div className="flex items-center gap-2">
                <Input value={given} onChange={(e) => setGiven(e.target.value)} placeholder="Cash given (optional)" aria-label="Cash given" inputMode="decimal" />
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground" aria-live="polite">
                  {given.trim() ? (change == null ? "Not enough" : `Change ${formatCurrency(change)}`) : null}
                </span>
              </div>
            ) : null}
            {mode === "sell" ? (
              <div className="grid grid-cols-2 gap-3">
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="For (optional)" aria-label="Recipient name" maxLength={200} />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their email (optional)" aria-label="Recipient email" type="email" />
              </div>
            ) : null}
            <FormError message={error} />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <RoleButton need={["orders.take"]} disabled={busy || !valid} onClick={() => void submit()}>
                {busy ? "Working…" : mode === "sell" ? `Sell · ${formatCurrency(value || 0)}` : `Reload · ${formatCurrency(value || 0)}`}
              </RoleButton>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
