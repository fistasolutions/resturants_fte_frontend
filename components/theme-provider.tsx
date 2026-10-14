"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme switching (SPEC-015): LIGHT is the default (owner decision,
 * 2026-07-15); the dark palette remains one toggle away and persists in
 * localStorage under "theme". Replaces next-themes (SPEC-015 Patches,
 * 2026-07-21): its client-rendered <script> tag triggers a Next 16 console
 * error. The pre-paint class application lives in the root layout as a
 * `beforeInteractive` script; the source of truth is the <html> class, read
 * here via useSyncExternalStore — no provider, no script, no effect state.
 */

type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Pre-paint theme bootstrap — inlined via next/script in app/layout.tsx. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// The server always renders light — the init script upgrades before paint.
function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme(): {
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
} {
  const resolvedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((theme: Theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode) — the toggle still works for the session.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { resolvedTheme, setTheme };
}
