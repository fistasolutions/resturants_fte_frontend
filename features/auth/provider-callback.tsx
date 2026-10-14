"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { goAfterSignIn } from "@/features/auth/after-sign-in";
import { FormAlert } from "@/features/auth/form-alert";
import { finishGoogle, finishShopify } from "@/services/auth";

/**
 * Where Google and Shopify send the browser back (SPEC-312). The query goes to
 * `/api/session`, which finishes the sign-in and sets the cookies; this page only
 * shows the wait and, if it fails, the way back.
 */
export function ProviderCallback({
  provider,
  query,
}: {
  provider: "google" | "shopify";
  query: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Once only: a provider's code can be exchanged a single time.
    if (started.current) return;
    started.current = true;
    const finish =
      provider === "google"
        ? finishGoogle(query.code ?? "", query.state ?? "")
        : finishShopify(query);
    finish
      .then((result) => goAfterSignIn(result))
      .catch((failure) =>
        setError(failure instanceof Error ? failure.message : "Sign-in could not be completed."),
      );
  }, [provider, query]);

  if (error) {
    return (
      <div className="space-y-4">
        <FormAlert message={error} />
        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      Signing you in…
    </p>
  );
}
