"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { normaliseShop } from "@/lib/auth-flows";
import { connectStoreUrl } from "@/services/onboarding";

/** Connect by link: the shop, then Shopify's own approval screen (backend SPEC-315). */
export function ConnectStep() {
  const [shop, setShop] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const domain = normaliseShop(shop);
    if (!domain) {
      setFieldError("Enter your shop, like yourstore or yourstore.myshopify.com.");
      document.getElementById("connect-shop")?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await connectStoreUrl(domain));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not reach Shopify.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="connect-shop">Your Shopify store</Label>
        <Input
          id="connect-shop"
          autoFocus
          autoComplete="off"
          placeholder="yourstore.myshopify.com"
          value={shop}
          onChange={(event) => {
            setShop(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "connect-shop-error" : "connect-shop-note"}
        />
        <FieldError id="connect-shop-error" message={fieldError} />
        <p id="connect-shop-note" className="text-xs text-muted-foreground">
          Shopify shows you exactly what access is asked for — you approve it there.
        </p>
      </div>
      <FormAlert message={error} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="size-4" aria-hidden />
        )}
        Connect Shopify
      </Button>
    </form>
  );
}
