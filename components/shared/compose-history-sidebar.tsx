"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock3,
  History,
  Inbox,
  PanelLeftClose,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/format";
import type { ComposeHistoryItem } from "@/types/compose";

interface ComposeHistorySidebarProps {
  historyUrl: string;
  showLocationName?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  /** Which item (by id) is currently shown read-only on the right, if any. */
  selectedId?: number | null;
  /** Clicking a card asks the parent to show that item's saved content
   * instead of the compose form — this component never fetches or renders
   * that view itself. */
  onSelectItem?: (item: ComposeHistoryItem) => void;
}

function formatSentAt(iso: string): string {
  return formatDateTime(iso); // store (NY) time — SPEC-129
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading send history">
      {[0, 1].map((item) => (
        <div key={item} className="space-y-3 rounded-lg border border-border p-3">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
          <div className="space-y-2 pt-1"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
        </div>
      ))}
    </div>
  );
}

/** Independent, non-blocking history rail for the compose workflow. */
export function ComposeHistorySidebar({
  historyUrl,
  showLocationName = false,
  open,
  onOpenChange,
  mobileOpen,
  onMobileOpenChange,
  selectedId = null,
  onSelectItem,
}: ComposeHistorySidebarProps) {
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ComposeHistoryItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(historyUrl, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) throw new Error(json?.error?.message ?? `Could not load history (${response.status}).`);
        setItems(json.items ?? []);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Could not load send history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt, historyUrl]);

  function renderHistoryPanel(titleId: string, allowCollapse: boolean) {
    return (
      <div className="flex size-full min-h-0 flex-col overflow-hidden bg-card">
      <header className={cn("flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4", !allowCollapse && "pr-12")}>
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" aria-hidden />
          <h2 id={titleId} className="text-sm font-medium">Send history</h2>
        </div>
        <div className="flex items-center gap-1">
          {!loading && !error ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground" aria-label={`${items.length} previous sends`}>
              {items.length}
            </span>
          ) : null}
          {allowCollapse ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              aria-label="Collapse send history"
              title="Collapse send history"
            >
              <PanelLeftClose aria-hidden />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-subtle">
        {loading ? <HistorySkeleton /> : null}

        {!loading && error ? (
          <div role="alert" className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="size-4" aria-hidden /></span>
            <p className="text-sm font-medium">History unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }}><RefreshCw aria-hidden />Retry</Button>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Inbox className="size-4" aria-hidden /></span>
            <p className="text-sm font-medium">No messages sent yet</p>
            <p className="mt-1 max-w-48 text-xs leading-5 text-muted-foreground">Your first sent message for this location will appear here.</p>
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem?.(item)}
                aria-pressed={item.id === selectedId}
                className={cn(
                  "block w-full min-w-0 rounded-lg border p-3 text-left transition-colors",
                  item.id === selectedId
                    ? "border-foreground/40 bg-muted/60"
                    : "border-border bg-card hover:border-foreground/20",
                )}
              >
                <h3 className="break-words text-sm font-medium leading-5">
                  {item.subject || <span className="italic text-muted-foreground">No subject</span>}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden />
                  <time dateTime={item.sent_at}>
                    {showLocationName && item.location_name ? `${item.location_name} · ` : ""}{formatSentAt(item.sent_at)}
                  </time>
                </div>
                {item.body ? <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words border-t border-border pt-3 text-xs leading-5 text-muted-foreground scrollbar-subtle">{item.body}</p> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      </div>
    );
  }

  return (
    <>
      <aside
        data-state={open ? "expanded" : "collapsed"}
        className={cn(
          "sticky top-6 hidden h-[calc(100svh-3rem)] shrink-0 self-start overflow-hidden rounded-card border border-border bg-card transition-[width] duration-200 lg:flex",
          open ? "w-70" : "w-14",
        )}
        aria-label="Send history sidebar"
      >
        {open ? renderHistoryPanel("send-history-title", true) : (
          <div className="flex size-full flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mt-3"
              onClick={() => onOpenChange(true)}
              aria-label="Expand send history"
              title="Expand send history"
            >
              <History aria-hidden />
            </Button>
            {!loading && !error && items.length > 0 ? (
              <span className="mt-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground" aria-label={`${items.length} previous sends`}>
                {items.length}
              </span>
            ) : null}
          </div>
        )}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[min(22rem,88vw)] gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Send history</SheetTitle>
            <SheetDescription>Previously sent messages for this location.</SheetDescription>
          </SheetHeader>
          {renderHistoryPanel("send-history-mobile-title", false)}
        </SheetContent>
      </Sheet>
    </>
  );
}
