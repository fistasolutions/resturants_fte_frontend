"use client";

import { useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";

type State = "idle" | "sending" | "sent" | "error";

interface SendToManagerButtonProps {
  /** Human-readable filter summary shown in the email subject, e.g. "Unfulfilled · North Store · 48h+" */
  filterSummary: string;
  /** Current page URL query string forwarded to the backend — same filters as the visible table. */
  apiQuery: string;
}

export function SendToManagerButton({ filterSummary, apiQuery }: SendToManagerButtonProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSend() {
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/proxy/orders/send-to-manager?${apiQuery}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter_summary: filterSummary }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.sent) {
        throw new Error(body?.error?.message ?? body?.error ?? "Could not send email.");
      }
      setState("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not send email.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-success"
      >
        <Check className="size-4" aria-hidden />
        Sent to managers
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <RoleButton
        need={["messages.send", "orders.view"]}
        type="button"
        variant="default"
        size="sm"
        onClick={handleSend}
        disabled={state === "sending"}
      >
        {state === "sending" ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Send to manager
          </>
        )}
      </RoleButton>
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
