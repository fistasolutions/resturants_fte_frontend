"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { storeQueries } from "@/lib/queries/store";

/** What a deep link into Settings asked of one field (SPEC-234): is this the
 * field the owner came for, and which page do they go back to once it's saved. */
export interface SettingsFieldFocus {
  focused: boolean;
  returnTo: string | null;
}

/** Ring drawn around the field a deep link points at — cleared on first edit. */
export const FOCUS_RING_CLASS = "ring-2 ring-primary ring-offset-2 ring-offset-background";

/**
 * Shared behaviour of every recipient field on the Manager Notifications tab.
 * When the field is the deep link's target it scrolls into view (centred, no
 * animation — Rule 9), takes keyboard focus so typing starts immediately, and
 * stays highlighted until the owner touches it. A successful save refreshes the
 * shared settings answer (so the tab badge's "n of m" is right) and, if the owner
 * came from a send page, takes them straight back to it.
 */
export function useSettingsField({ focused, returnTo }: SettingsFieldFocus) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The ring stays until the owner touches the field; derived, not mirrored,
  // so a change of `focused` never needs an effect to resync it.
  const [dismissed, setDismissed] = useState(false);
  const highlighted = focused && !dismissed;

  useEffect(() => {
    if (!focused) return;
    containerRef.current?.scrollIntoView({ block: "center" });
    inputRef.current?.focus();
  }, [focused]);

  return {
    containerRef,
    inputRef,
    highlighted,
    /** The owner started editing — the highlight has done its job. */
    touched: () => setDismissed(true),
    /** A save landed: keep the cached overview honest, then go back if asked. */
    saved: () => {
      setDismissed(true);
      void queryClient.invalidateQueries({ queryKey: storeQueries.settingsOverview().queryKey });
      if (focused && returnTo) router.push(returnTo);
    },
  };
}
