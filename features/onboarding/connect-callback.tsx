"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { FormAlert } from "@/features/auth/form-alert";
import { finishStoreConnect } from "@/services/onboarding";

/** Shopify's return from the approval screen: finish the connect, then back to the wizard
 * (which shows the first sync). A code is exchanged once only. */
export function ConnectCallback({ query }: { query: Record<string, string> }) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    finishStoreConnect(query)
      .then(() => window.location.replace("/onboarding"))
      .catch((failure) =>
        setError(failure instanceof Error ? failure.message : "The store could not be connected."),
      );
  }, [query]);

  if (error) {
    return (
      <div className="space-y-4">
        <FormAlert message={error} />
        <Link href="/onboarding" className="text-sm font-medium underline-offset-4 hover:underline">
          Back to setup
        </Link>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      Connecting…
    </p>
  );
}
