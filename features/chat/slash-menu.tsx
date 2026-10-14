"use client";

import { CornerDownLeft } from "lucide-react";

import { PERIOD_OPTIONS, type SlashCommand } from "@/lib/slash-commands";
import { cn } from "@/lib/utils";

interface SlashMenuProps {
  /** The commands matching what is typed so far, menu order. */
  items: SlashCommand[];
  /** Index of the highlighted row. */
  active: number;
  onHover: (index: number) => void;
  onPick: (command: SlashCommand) => void;
  /** The picked command that still wants its argument, if any. */
  pending: SlashCommand | null;
  onPeriod: (period: string) => void;
  menuId: string;
}

/**
 * The shortcut list above the message box (SPEC-260): rows narrow as the owner
 * types, ↑ ↓ move, Tab or Enter fills, Esc closes. After a pick, a period
 * command offers its five periods as chips and a name command asks for the name.
 */
export function SlashMenu({ items, active, onHover, onPick, pending, onPeriod, menuId }: SlashMenuProps) {
  return (
    <div
      data-slash-menu
      className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-card border bg-popover text-popover-foreground shadow-md"
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-semibold tracking-wide uppercase">Shortcuts</span>
        <span className="hidden sm:inline">
          <kbd className="rounded-sm border px-1 text-[10px]">↑↓</kbd> move ·{" "}
          <kbd className="rounded-sm border px-1 text-[10px]">Tab</kbd> pick ·{" "}
          <kbd className="rounded-sm border px-1 text-[10px]">Esc</kbd> close
        </span>
      </div>

      {pending ? (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 text-xs" data-slash-pending>
          {pending.arg === "period" ? (
            <>
              <span className="text-muted-foreground">Period</span>
              {PERIOD_OPTIONS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPeriod(period)}
                  className="rounded-md border bg-background px-2 py-0.5 font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  {period}
                </button>
              ))}
              <span className="text-muted-foreground">
                — or press <kbd className="rounded-sm border px-1 text-[10px]">Enter</kbd> for the last 7 days
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Type the {pending.name === "watch" ? "rule" : `${pending.name} name`}, then press{" "}
              <kbd className="rounded-sm border px-1 text-[10px]">Enter</kbd> — e.g.{" "}
              <span className="font-medium text-foreground">
                /{pending.name}{" "}
                {pending.name === "store"
                  ? "Amsterdam"
                  : pending.name === "watch"
                    ? "returns on Linen Shirt pass 20%"
                    : "Linen Shirt"}
              </span>
            </span>
          )}
        </div>
      ) : items.length === 0 ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No shortcut starts with that — press Enter to send it as a question.
        </p>
      ) : (
        <ul id={menuId} role="listbox" aria-label="Slash shortcuts" className="scrollbar-subtle max-h-64 overflow-y-auto p-1">
          {items.map((command, index) => (
            <li
              key={command.name}
              id={`${menuId}-${command.name}`}
              role="option"
              aria-selected={index === active}
              data-slash-item={command.name}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(command)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                index === active ? "bg-accent text-accent-foreground" : "text-foreground",
              )}
            >
              <span className="shrink-0 font-mono text-xs font-semibold">/{command.name}</span>
              {command.hint && (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{command.hint}</span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{command.summary}</span>
              {index === active && <CornerDownLeft className="size-3 shrink-0 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
