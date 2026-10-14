"use client";

import { useRef } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlispSphere } from "@/features/chat/glisp-sphere";
import { useApiQuery } from "@/hooks/use-api-query";
import { chatQueries } from "@/lib/queries/chat";
import { cn } from "@/lib/utils";

interface TalkButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /** SPEC-271: voice mode is on — the sphere is lit and the click turns it off. */
  active?: boolean;
  /** The pill variant: the small sphere plus the word. */
  withLabel?: boolean;
  className?: string;
}

/**
 * The way into Talk to Glisp (SPEC-268): the small glass sphere. Disabled, with
 * the reason, when the store has no OpenAI key — voice needs one even when the
 * brain is another model.
 */
export function TalkButton({ onClick, disabled = false, active = false, withLabel = false, className }: TalkButtonProps) {
  const status = useApiQuery(chatQueries.voiceStatus(), { staleTime: 5 * 60_000 });
  const levelRef = useRef(0);
  const available = status.data?.available ?? true;
  const reason = status.data?.reason ?? null;
  const off = disabled || !available;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex", off && "opacity-60")}>
          <button
            type="button"
            onClick={onClick}
            disabled={off}
            aria-label={active ? "Back to typing" : "Talk to Glisp"}
            aria-pressed={active}
            data-talk
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
              withLabel ? "pl-1 pr-2 text-sm font-medium" : "size-8 justify-center bg-voice-stage-deep ring-1 ring-border",
              active && "ring-2 ring-ai ring-offset-2 ring-offset-background",
              className,
            )}
          >
            <GlispSphere state="idle" levelRef={levelRef} size={withLabel ? 22 : 26} label="Glisp" />
            {withLabel && "Talk"}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {active
          ? "Back to typing"
          : available
          ? `Talk to Glisp — out loud, both ways${status.data?.provider ? ` · ${status.data.provider === "gemini" ? "Google Gemini" : "OpenAI"} voice` : ""}`
          : (reason ?? "Voice is unavailable")}
      </TooltipContent>
    </Tooltip>
  );
}
