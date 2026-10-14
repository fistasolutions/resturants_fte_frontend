import { GlispIcon, type GlispMotion, type GlispState } from "@/components/shared/glisp-icon";

/** The analyst's avatar — Glisp (SPEC-248). The icon carries its own rounded tile
 * in the foreground token, so only the size comes from `className`; the rounding
 * classes callers pass are harmless. `state` / `motion` animate it (SPEC-252). */
export function BotAvatar({
  className = "size-9 rounded-lg",
  state,
  motion,
}: {
  className?: string;
  state?: GlispState;
  motion?: GlispMotion;
}) {
  return (
    <GlispIcon variant="tile" state={state} motion={motion} className={`shrink-0 ${className}`} aria-hidden />
  );
}
