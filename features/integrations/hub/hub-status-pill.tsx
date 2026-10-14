import { LoaderCircle } from "lucide-react";

import { STATUS_META, type Tone } from "@/lib/integration-hub";
import { cn } from "@/lib/utils";
import type { HubStatus } from "@/types/integrations";

export const TONE_PILL: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-foreground",
  muted: "bg-muted text-muted-foreground",
};

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  neutral: "bg-foreground/60",
  muted: "bg-muted-foreground",
};

/** A connection's status as a pill — the word always, the colour only to support it. */
export function HubStatusPill({ status, className }: { status: HubStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        TONE_PILL[meta.tone],
        className,
      )}
    >
      {status === "syncing" ? (
        <LoaderCircle className="size-3 animate-spin" aria-hidden />
      ) : (
        <span className={cn("size-1.5 rounded-full", TONE_DOT[meta.tone])} aria-hidden />
      )}
      {meta.label}
    </span>
  );
}
