"use client";

import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCan } from "@/hooks/use-can";
import type { RoleNeed } from "@/lib/role-gate";
import { cn } from "@/lib/utils";

/**
 * Role-aware actions (frontend SPEC-358, root ABSOLUTE RULE 13).
 *
 * `RoleButton` — a main action (send, publish, approve, export, generate, sync, delete). A role
 * without the permission sees it disabled, with the reason on hover/focus and for screen readers,
 * so they know the work needs someone else.
 *
 * `RoleGate` — a small or secondary action (edit, a menu item, a toggle): not rendered at all
 * for a role without the permission.
 */
export function RoleButton({
  need,
  disabled,
  children,
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button> & { need: RoleNeed }) {
  const can = useCan();
  const gate = can(need);
  const reasonId = useId();
  if (gate.allowed) {
    return (
      <Button disabled={disabled} className={className} onClick={onClick} {...props}>
        {children}
      </Button>
    );
  }
  // `aria-disabled`, not `disabled`: the button keeps focus and pointer events so the tooltip can
  // explain why, keeps its own place in the layout, and does nothing when pressed (a submit
  // included).
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          aria-disabled
          aria-describedby={reasonId}
          data-role-denied=""
          className={cn(className, "cursor-not-allowed opacity-50")}
          onClick={(event) => event.preventDefault()}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{gate.reason}</TooltipContent>
      <span id={reasonId} className="sr-only">
        {gate.reason}
      </span>
    </Tooltip>
  );
}

export function RoleGate({ need, children }: { need: RoleNeed; children: ReactNode }) {
  const can = useCan();
  return can(need).allowed ? <>{children}</> : null;
}
