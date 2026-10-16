"use client";

import { useState } from "react";
import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/restaurant/parts";
import { proved, rewardOptions, type PointsState } from "@/lib/loyalty-online";
import { requestLoyaltyCode, verifyLoyaltyCode } from "@/services/storefront-actions";

/**
 * "Use your points" at online checkout (SPEC-399 over backend SPEC-419): a code to the member's email
 * proves the phone, then a reward can join the order. `state` is already the step to show.
 */
export function UsePoints({
  slug,
  programName,
  phone,
  state,
  onState,
  rewardId,
  onReward,
}: {
  slug: string;
  programName: string;
  phone: string;
  state: PointsState;
  onState: (state: PointsState) => void;
  rewardId: number | null;
  onReward: (id: number | null) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestLoyaltyCode(slug, phone.trim());
      setCode("");
      onState({ phase: "code", phone: phone.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The code could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await verifyLoyaltyCode(slug, phone.trim(), code);
      onReward(null);
      onState(proved(phone.trim(), session, Date.now()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not right or has expired.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="space-y-2 rounded-2xl border border-border p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-medium">
        <Gift className="size-4" aria-hidden /> Use your {programName} points
      </legend>
      {state.phase === "ask" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">We email a code to the address on your membership to confirm it is you.</p>
          <Button type="button" variant="outline" size="sm" disabled={busy || phone.replace(/\D/g, "").length < 7} onClick={() => void send()}>
            {busy ? "Sending…" : "Email me a code"}
          </Button>
          {phone.replace(/\D/g, "").length < 7 ? <p className="text-xs text-muted-foreground">Type your phone above first.</p> : null}
        </div>
      ) : null}
      {state.phase === "code" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">If this phone belongs to a member with an email on file, a code is on its way. It works for 10 minutes.</p>
          <Label htmlFor="co-points-code">Code</Label>
          <div className="flex gap-2">
            <Input
              id="co-points-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="w-36"
            />
            <Button type="button" size="sm" disabled={busy || code.replace(/\D/g, "").length !== 6} onClick={() => void confirm()}>
              {busy ? "Checking…" : "Confirm"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void send()}>
              Send again
            </Button>
          </div>
        </div>
      ) : null}
      {state.phase === "proved" ? (
        <div className="space-y-2" role="radiogroup" aria-label="Choose a reward">
          <p className="text-sm">
            You have <span className="font-semibold tabular-nums">{state.session.points}</span> points.
          </p>
          {state.session.rewards.length === 0 ? <p className="text-xs text-muted-foreground">There are no rewards to choose yet.</p> : null}
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="co-reward" checked={rewardId === null} onChange={() => onReward(null)} /> Don&apos;t use a reward
          </label>
          {rewardOptions(state.session).map((r) => (
            <label key={r.id} className={r.disabled ? "flex items-center gap-2 text-sm text-muted-foreground" : "flex items-center gap-2 text-sm"}>
              <input type="radio" name="co-reward" disabled={r.disabled} checked={rewardId === r.id} onChange={() => onReward(r.id)} /> {r.label}
            </label>
          ))}
        </div>
      ) : null}
      <FormError message={error} />
    </fieldset>
  );
}
