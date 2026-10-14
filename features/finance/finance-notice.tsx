"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";

import { FINANCE_ROOT } from "@/lib/finance";
import { cn } from "@/lib/utils";

/**
 * What came back from the connect round trip (SPEC-299) — one dismissible line, never a
 * banner stack. Three cases only: a company connected, Intuit refused, or the owner
 * pressed Cancel (which is not a failure and gets no red).
 */
export function FinanceNotice({
  error,
  onDismissError,
}: {
  error?: string | null;
  onDismissError?: () => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const connected = params.get("connected");
  const failed = params.get("qbo_error");
  const cancelled = params.get("qbo_cancelled");
  const message = error ?? failed ?? (cancelled ? "Connection cancelled — nothing changed." : null);
  const tone = error || failed ? "bad" : "neutral";

  const clear = () => {
    setDismissed(true);
    onDismissError?.();
    if (connected || failed || cancelled) {
      const next = new URLSearchParams(params.toString());
      for (const key of ["connected", "qbo_error", "qbo_cancelled"]) next.delete(key);
      const query = next.toString();
      router.replace(query ? `${FINANCE_ROOT}?${query}` : FINANCE_ROOT, { scroll: false });
    }
  };

  if (dismissed && !error) return null;
  if (!connected && !message) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs",
        connected && !message
          ? "border-success/40 bg-success/5"
          : tone === "bad"
            ? "border-destructive/40 bg-destructive/5"
            : "border-border bg-card",
      )}
    >
      {connected && !message ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
      ) : (
        <AlertTriangle
          className={cn("mt-0.5 size-3.5 shrink-0", tone === "bad" ? "text-destructive" : "text-muted-foreground")}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 leading-relaxed">
        {message ?? (
          <>
            <b className="font-semibold">{connected}</b> connected. Its bills appear as soon as the
            first sync finishes.
          </>
        )}
      </span>
      <button
        type="button"
        onClick={clear}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
