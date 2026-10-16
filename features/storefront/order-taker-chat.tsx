"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/features/restaurant/parts";
import { MAX_LENGTH, canSend, proposalToCart } from "@/lib/order-taker";
import { cn } from "@/lib/utils";
import { chatOrderTaker } from "@/services/storefront-actions";
import type { CartLineInput, OrderTakerAnswer, OrderTakerTurn } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

/** Order by chat (SPEC-392 over backend SPEC-412): the Order Taker proposes, the guest decides. */
export function OrderTakerChat({
  slug,
  branchId,
  onUse,
}: {
  slug: string;
  branchId: number;
  onUse: (lines: CartLineInput[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<OrderTakerTurn[]>([
    { role: "assistant", content: "Hi! Tell me what you'd like and I'll put the order together for you." },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<OrderTakerAnswer | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend(history, text)) return;
    const next: OrderTakerTurn[] = [...history, { role: "user", content: text.trim() }];
    setHistory(next);
    setText("");
    setBusy(true);
    setError(null);
    try {
      const answer = await chatOrderTaker(slug, branchId, next);
      setHistory([...next, { role: "assistant", content: answer.reply }]);
      if (answer.cart) setProposal(answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The chat is unavailable.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <MessageCircle aria-hidden /> Order by chat
      </Button>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label="Order by chat">
      <ul className="max-h-72 space-y-2 overflow-y-auto text-sm" aria-live="polite">
        {history.map((turn, i) => (
          <li
            key={i}
            className={cn(
              "w-fit max-w-[85%] rounded-2xl px-3 py-2",
              turn.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground",
            )}
          >
            {turn.content}
          </li>
        ))}
        {busy ? <li className="w-fit rounded-2xl bg-muted px-3 py-2 text-muted-foreground">…</li> : null}
      </ul>
      {proposal?.cart && proposal.quote ? (
        <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
          <p className="font-medium">Suggested order</p>
          <ul className="space-y-1">
            {proposal.quote.lines.map((line, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span className="tabular-nums">{formatCurrency(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between font-medium">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(proposal.quote.subtotal)}</span>
          </p>
          <Button
            className="w-full"
            onClick={() => {
              if (proposal.cart) onUse(proposalToCart(proposal.cart, proposal.quote, String(Date.now())));
              setProposal(null);
            }}
          >
            Use this order
          </Button>
        </div>
      ) : null}
      <FormError message={error} />
      <form onSubmit={(e) => void send(e)} className="flex gap-2">
        <Input
          aria-label="Your message"
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          placeholder="Two large pepperoni for pickup…"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={busy || !canSend(history, text)}>
          <Send aria-hidden />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">Prices come from the menu; you check out as usual.</p>
    </section>
  );
}
