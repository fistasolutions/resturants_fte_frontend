"use client";

import Link from "next/link";
import { History, MoreHorizontal, RefreshCw, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHub } from "@/features/integrations/hub/hub-context";
import type { IntegrationApp } from "@/lib/integration-catalog";
import { detailHref } from "@/lib/integration-hub";
import type { HubConnection } from "@/types/integrations";

/** A connection's quick actions. Disconnect opens the app's Settings, where it is confirmed. */
export function ConnectionMenu({ app, connection }: { app: IntegrationApp; connection: HubConnection }) {
  const { syncNow, starting } = useHub();
  const canSync = connection.canSync && connection.status !== "syncing" && !starting.has(app.key);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`More actions for ${app.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(event) => event.stopPropagation()}>
        {connection.canSync ? (
          <DropdownMenuItem disabled={!canSync} onSelect={() => void syncNow(app.key, app.name)}>
            <RefreshCw aria-hidden />
            Sync now
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={detailHref(app.key, "settings")}>
            <Settings2 aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        {app.kind !== "app" || connection.runs.length ? (
          <DropdownMenuItem asChild>
            <Link href={detailHref(app.key, "history")}>
              <History aria-hidden />
              Sync history
            </Link>
          </DropdownMenuItem>
        ) : null}
        {app.kind !== "app" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild variant="destructive">
              <Link href={detailHref(app.key, "settings", { disconnect: "1" })}>
                <Trash2 aria-hidden />
                Disconnect…
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
