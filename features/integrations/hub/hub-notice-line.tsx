"use client";

import { Check, CircleAlert, X } from "lucide-react";

import { useHub } from "@/features/integrations/hub/hub-context";
import { cn } from "@/lib/utils";

/** The one line an action answers on — a sync started, or why it did not. */
export function HubNoticeLine() {
  const { notice, say } = useHub();
  return (
    <div aria-live="polite" className={cn(!notice && "hidden")}>
      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
            notice.tone === "error" ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5",
          )}
        >
          {notice.tone === "error" ? (
            <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
          ) : (
            <Check className="size-4 shrink-0 text-success" aria-hidden />
          )}
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => say(null)}
          >
            <X className="size-4" aria-hidden />
          </button>
        </p>
      ) : null}
    </div>
  );
}
