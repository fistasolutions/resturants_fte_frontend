"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiQuery } from "@/hooks/use-api-query";
import { KIND_TONE, badgeText, bellLabel, notificationHref } from "@/lib/notifications";
import { NOTIFICATIONS_POLL_MS, notificationQueries } from "@/lib/queries/notifications";
import { agoLabel } from "@/lib/trust-footer";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/services/notifications-actions";
import type { AppNotification } from "@/types/notifications";

const DOT: Record<"ok" | "ask" | "bad", string> = {
  ok: "bg-success",
  ask: "bg-warning",
  bad: "bg-destructive",
};

/**
 * The store's inbox (SPEC-335 / backend SPEC-343): a scheduled report that sent itself,
 * one waiting for approval, one that failed. Polls once a minute while the app is open;
 * opening a notification marks it read.
 */
export function NotificationsBell({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const inbox = useApiQuery(notificationQueries.inbox(), { refetchInterval: NOTIFICATIONS_POLL_MS });
  const [open, setOpen] = useState(false);
  const unread = inbox.data?.unread ?? 0;
  const badge = badgeText(unread);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });

  async function read(item: AppNotification) {
    setOpen(false);
    if (!item.read) {
      await markNotificationRead(item.id).catch(() => undefined);
      refresh();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={bellLabel(unread)}
          title={bellLabel(unread)}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            className,
          )}
        >
          <Bell className="size-4" aria-hidden />
          {badge ? (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground tabular-nums">
              {badge}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={unread === 0}
            onClick={async () => {
              await markAllNotificationsRead().catch(() => undefined);
              refresh();
            }}
          >
            <CheckCheck className="size-3.5" aria-hidden /> Mark all read
          </Button>
        </div>
        {inbox.isError ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Notifications couldn&rsquo;t load.</p>
        ) : !inbox.data ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : inbox.data.items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto scrollbar-subtle">
            {inbox.data.items.map((item) => {
              const href = notificationHref(item);
              const body = (
                <span className="flex gap-2.5 px-3 py-2.5">
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : DOT[KIND_TONE[item.kind] ?? "ok"])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", item.read ? "text-muted-foreground" : "font-medium text-foreground")}>
                      {item.title}
                    </span>
                    {item.body ? <span className="block truncate text-xs text-muted-foreground">{item.body}</span> : null}
                    {item.createdAt ? (
                      <span className="block text-[11px] text-muted-foreground">{agoLabel(item.createdAt)}</span>
                    ) : null}
                  </span>
                </span>
              );
              return (
                <li key={item.id}>
                  {href ? (
                    <Link href={href} onClick={() => void read(item)} className="block outline-none hover:bg-muted/50 focus-visible:bg-muted/50">
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => void read(item)} className="block w-full text-left hover:bg-muted/50">
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
