"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalChatDrawer } from "@/features/chat/chat-drawer-provider";
import { pageContextFor } from "@/lib/chat-context";
import { explainQuestion, withFocus, type ExplainTarget } from "@/lib/explain";
import { GLISP_MOTION_MS } from "@/lib/glisp-motion";
import { cn } from "@/lib/utils";
import { dateToISO } from "@/utils/date";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface ExplainButtonProps {
  /** What the card shows — label, value, delta, caption. */
  target: ExplainTarget;
  /** `corner`: absolute top-right (the card must be `relative`). `inline`: sits
   * in the card's own header row, next to its icon. */
  placement?: "corner" | "inline";
  className?: string;
}

/**
 * ✦ Explain this (SPEC-242): one click on a KPI card or verdict tile opens the
 * Ask Glisp panel with the question about the card's figure in the composer,
 * ready to send (since the 2026-09-18 patch the owner sends it) — page context
 * (SPEC-236) plus `focus`, the card as printed, so the analyst re-fetches that
 * exact figure with its tool (backend SPEC-249) and explains what moved it.
 *
 * Renders nothing outside the drawer provider or on `/chat` (where the drawer
 * is suppressed). Sits *beside* a tile that is itself a link, never inside it.
 */
export function ExplainButton({ target, placement = "corner", className }: ExplainButtonProps) {
  const drawer = useOptionalChatDrawer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // SPEC-252: the press plays "send" — the rays draw into the dot — for its duration.
  const [sending, setSending] = useState(false);
  if (!drawer || drawer.suppressed) return null;

  const label = `Explain ${target.metric.trim() || "this"}`;

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const context = pageContextFor(pathname, searchParams, dateToISO(new Date()));
    drawer?.draft(explainQuestion(target), withFocus(context, target));
    setSending(true);
    window.setTimeout(() => setSending(false), GLISP_MOTION_MS.send);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          data-explain
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 outline-none transition-colors",
            "hover:bg-ai/10 hover:text-ai focus-visible:bg-ai/10 focus-visible:text-ai focus-visible:ring-2 focus-visible:ring-ring",
            placement === "corner" && "absolute top-1.5 right-1.5",
            className,
          )}
        >
          <GlispIcon className="size-3.5" motion={sending ? "send" : undefined} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Explain this</TooltipContent>
    </Tooltip>
  );
}
