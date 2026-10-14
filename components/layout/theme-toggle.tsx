"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const emptySubscribe = () => () => {};

/** Sun/Moon theme switch — hydration-safe (server renders a neutral button). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // true after hydration only — avoids a server/client icon mismatch.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  const Icon = isDark ? Sun : Moon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={label}
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
