"use client";

import Link from "next/link";

import { AppLogo } from "@/features/integrations/hub/app-logo";
import { NextStepButton } from "@/features/integrations/hub/next-step-button";
import { appFor, detailHref, needsOwner } from "@/lib/integration-hub";
import { cn } from "@/lib/utils";
import type { HubConnection } from "@/types/integrations";

/** One card per connection the owner has to act on, with the reason and the fix. */
export function NeedsYou({ connections }: { connections: HubConnection[] }) {
  const due = connections.filter((c) => c.connected && needsOwner(c) && c.attention);
  if (!due.length) return null;
  return (
    <section aria-label="Needs you" className="grid gap-3 lg:grid-cols-2">
      {due.map((connection) => {
        const app = appFor(connection.key);
        if (!app) return null;
        return (
          <div
            key={connection.key}
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-2xl border border-l-4 bg-card px-4 py-3.5 shadow-xs",
              connection.status === "attention" ? "border-l-destructive" : "border-l-warning",
            )}
          >
            <AppLogo src={app.logo} />
            <div className="min-w-0 flex-1 basis-56">
              <Link href={detailHref(app.key)} className="font-semibold hover:underline">
                {app.name}
              </Link>
              <p className="text-sm text-muted-foreground">{connection.attention?.message}</p>
            </div>
            <NextStepButton connection={connection} appKey={app.key} />
          </div>
        );
      })}
    </section>
  );
}
