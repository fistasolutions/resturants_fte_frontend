"use client";

import Link from "next/link";
import { Check, ExternalLink, Lock } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { OUTSIDE_LABELS } from "@/lib/customer-support";
import type { OutsideAction } from "@/types/customer-support";

/**
 * What the product may not do (SPEC-346 §Out): changing an order in Shopify or starting a
 * return in Loop. The agent prepares each one with every detail; a person does it in the system
 * that owns it and marks it done here. Each says plainly that automating it needs an owner
 * decision.
 *
 * SPEC-364 (Rule 13): a role that may not mark one done sees Mark done disabled with the role's
 * reason beside it.
 */
export function OutsideActions({
  actions,
  busy,
  onDone,
  roleReason = null,
}: {
  actions: OutsideAction[];
  busy: boolean;
  onDone: (actionId: string) => void;
  /** Why the member's role may not mark an action done; null when it may. */
  roleReason?: string | null;
}) {
  if (actions.length === 0) return null;
  return (
    <section className="space-y-2" aria-label="Prepared for a person">
      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Prepared for you to do</h3>
      {actions.map((action) => (
        <div key={action.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
              {OUTSIDE_LABELS[action.kind]} · <span className="font-normal">{action.summary}</span>
            </p>
            {action.state === "done" ? (
              <StatusBadge tone="success">Done</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">
                <Lock className="size-3" aria-hidden /> Needs an owner decision to automate
              </StatusBadge>
            )}
          </div>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {action.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          {action.state === "prepared" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={action.href} prefetch={false} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <ExternalLink aria-hidden /> Do this in {action.system}
              </Link>
              <Button size="sm" variant="ghost" disabled={busy || roleReason !== null} onClick={() => onDone(action.id)}>
                <Check aria-hidden /> Mark done
              </Button>
              {roleReason ? <span className="text-[11px] text-muted-foreground">{roleReason}</span> : null}
              <span className="text-[11px] text-muted-foreground">
                This app is read-only toward {action.system}; the change is yours to make there.
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
