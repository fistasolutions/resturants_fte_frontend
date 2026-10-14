"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { GoogleMark, ShopifyMark } from "@/components/shared/provider-marks";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/features/auth/form-alert";
import { normaliseShop } from "@/lib/auth-flows";
import type { SignInProviders } from "@/lib/auth-providers";
import { googleStartUrl, shopifyStartUrl } from "@/services/auth";

/**
 * Continue with Google · Continue with Shopify (SPEC-312). Both prove the address
 * themselves, so neither asks for a code. Shopify needs the shop first — the field
 * opens in place, one extra step only for the people who pick it. Each is drawn only when
 * its switch is on (SPEC-340).
 */
/** A provider button: white card, a real brand mark, and room to breathe. */
const PROVIDER =
  "h-11 w-full gap-3 rounded-lg border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:border-foreground/25 hover:bg-muted/60";

export function ProviderButtons({
  next,
  providers,
}: {
  next?: string | null;
  providers: SignInProviders;
}) {
  const [busy, setBusy] = useState<"google" | "shopify" | null>(null);
  const [askShop, setAskShop] = useState(false);
  const [shop, setShop] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function go(provider: "google" | "shopify") {
    setError(null);
    let domain: string | null = null;
    if (provider === "shopify") {
      domain = normaliseShop(shop);
      if (!domain) {
        setError("Enter your shop, like yourstore or yourstore.myshopify.com.");
        document.getElementById("provider-shop")?.focus();
        return;
      }
    }
    setBusy(provider);
    try {
      const url =
        provider === "google"
          ? await googleStartUrl(next)
          : await shopifyStartUrl(domain as string, next);
      window.location.assign(url);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start sign-in.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {providers.google ? (
        <Button
          type="button"
          variant="outline"
          className={PROVIDER}
          disabled={busy !== null}
          onClick={() => go("google")}
        >
          {busy === "google" ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <GoogleMark className="size-5" />
          )}
          Continue with Google
        </Button>
      ) : null}
      {!providers.shopify ? null : askShop ? (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void go("shopify");
          }}
        >
          <Label htmlFor="provider-shop" className="flex items-center gap-2">
            <ShopifyMark className="size-4" />
            Your Shopify store
          </Label>
          <div className="flex gap-2">
            <Input
              id="provider-shop"
              autoFocus
              placeholder="yourstore.myshopify.com"
              className="h-11"
              autoComplete="off"
              value={shop}
              onChange={(event) => setShop(event.target.value)}
            />
            <Button type="submit" className={cn("h-11 px-5")} disabled={busy !== null}>
              {busy === "shopify" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={PROVIDER}
          disabled={busy !== null}
          onClick={() => setAskShop(true)}
        >
          <ShopifyMark className="size-5" />
          Continue with Shopify
        </Button>
      )}
      <FormAlert message={error} />
    </div>
  );
}
