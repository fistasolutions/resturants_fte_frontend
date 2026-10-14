"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/form-alert";

/**
 * SPEC-344: the store was already approved in Shopify (installed from Shopify's side) — one
 * click attaches it to this company. The claim itself stays in an httpOnly cookie; this only
 * asks the server route to use it.
 */
export function InstallClaimStep({ shop }: { shop: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/shopify/install/claim", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(body?.message ?? "Could not finish connecting. Try again.");
        setBusy(false);
        return;
      }
      window.location.assign("/onboarding");
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Finish connecting {shop}</p>
        <p className="text-sm text-muted-foreground">
          You already approved ftes in Shopify — one click and your first sync starts.
        </p>
      </div>
      <FormAlert message={error} />
      <Button type="button" className="w-full" disabled={busy} onClick={() => void finish()}>
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="size-4" aria-hidden />
        )}
        Connect {shop}
      </Button>
    </div>
  );
}
