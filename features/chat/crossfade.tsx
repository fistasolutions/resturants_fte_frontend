"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface CrossfadeProps {
  /** Which layer is showing. */
  mode: string;
  /** The layers by key; the current one and, for 200 ms, the one leaving. */
  layers: Record<string, React.ReactNode>;
  className?: string;
}

const FADE_MS = 200;

/**
 * A two-layer switch (SPEC-271): the outgoing layer fades out while the incoming
 * one fades in, 200 ms, then the outgoing layer unmounts. Interaction-driven
 * motion only — nothing here plays on load.
 */
export function Crossfade({ mode, layers, className }: CrossfadeProps) {
  const [leaving, setLeaving] = useState<string | null>(null);
  const [previous, setPrevious] = useState(mode);
  if (mode !== previous) {
    setPrevious(mode);
    setLeaving(previous);
  }
  useEffect(() => {
    if (leaving === null) return;
    const timer = window.setTimeout(() => setLeaving(null), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  return (
    <div className={cn("relative min-h-0 flex-1", className)} data-crossfade={mode}>
      <div key={mode} className="absolute inset-0 flex min-h-0 flex-col animate-in fade-in-0 duration-200">
        {layers[mode]}
      </div>
      {leaving !== null && leaving !== mode && (
        <div key={`leaving-${leaving}`} className="pointer-events-none absolute inset-0 flex min-h-0 flex-col animate-out fade-out-0 fill-mode-forwards duration-200">
          {layers[leaving]}
        </div>
      )}
    </div>
  );
}
