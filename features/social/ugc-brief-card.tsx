import { Quote, User } from "lucide-react";

import type { UgcBrief } from "@/types/social";

/**
 * The written piece behind a UGC clip (SPEC-189).
 *
 * Veo voices `script` verbatim, so this is not a summary of the video — it is
 * the video's words. Showing it while the job runs means the owner can reject a
 * bad line at the point it is still free to reject, instead of paying to find
 * out after the render.
 */
export function UgcBriefCard({ brief }: { brief: UgcBrief }) {
  const persona = brief.persona;
  const overlay = brief.onScreenText ?? brief.on_screen_text ?? null;

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        The script
      </p>

      <p className="flex gap-1.5 text-sm leading-relaxed text-foreground">
        <Quote className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
        <span>{brief.script}</span>
      </p>

      {persona && (
        <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
          <User className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{persona.name}</span>
            {persona.who ? ` — ${persona.who}` : ""}
            {persona.setting ? `. ${persona.setting}` : ""}
          </span>
        </p>
      )}

      {overlay && (
        <p className="text-xs text-muted-foreground">On screen: “{overlay}”</p>
      )}
    </div>
  );
}
