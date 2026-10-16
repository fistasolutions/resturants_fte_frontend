"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/restaurant/parts";
import { sendCateringInquiry } from "@/services/storefront-actions";

/** The brand's catering request (SPEC-391): a person answers with a quote from the branch's menu. */
export function CateringForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("20");
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm">
        Thank you — your request {done} is with us. We will send a quote shortly.
      </p>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await sendCateringInquiry(slug, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        eventDate: date,
        eventTime: time || null,
        guests: Number(guests),
        fulfilment,
        address: fulfilment === "delivery" ? address.trim() || null : null,
        notes: notes.trim() || null,
      });
      setDone(result.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="c-name">Your name</Label>
        <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-guests">Guests</Label>
        <Input id="c-guests" type="number" min={1} max={2000} required value={guests} onChange={(e) => setGuests(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-phone">Phone</Label>
        <Input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-date">Date</Label>
        <Input id="c-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-time">Time (optional)</Label>
        <Input id="c-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <fieldset className="space-y-1 sm:col-span-2">
        <legend className="text-sm font-medium">Delivery or pickup</legend>
        <div className="flex gap-4 text-sm">
          {(["delivery", "pickup"] as const).map((value) => (
            <label key={value} className="inline-flex items-center gap-2">
              <input type="radio" name="c-fulfilment" checked={fulfilment === value} onChange={() => setFulfilment(value)} />
              {value === "delivery" ? "Delivery" : "Pickup"}
            </label>
          ))}
        </div>
      </fieldset>
      {fulfilment === "delivery" ? (
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="c-address">Delivery address</Label>
          <Input id="c-address" required value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      ) : null}
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="c-notes">What are you planning? (optional)</Label>
        <Textarea id="c-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <FormError message={error} />
        <Button type="submit" disabled={busy || !name.trim() || !date || (!email.trim() && !phone.trim())}>
          {busy ? "Sending…" : "Request a quote"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Leave an email or a phone number so we can send your quote.</p>
      </div>
    </form>
  );
}
