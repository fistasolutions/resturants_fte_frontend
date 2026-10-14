"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, LoaderCircle, MoreHorizontal, Pause, Pencil, Play, Plus, RefreshCw, Trash2 } from "lucide-react";

import { ListSkeleton } from "@/features/settings/settings-skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { WatchDialog } from "@/features/settings/watch-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { watchQueries } from "@/lib/queries/watches";
import { cn } from "@/lib/utils";
import {
  EXAMPLES,
  PERIOD_LABELS,
  meter,
  relative,
  statusLabel,
  tellLabels,
  type StatusTone,
  type WatchFormValue,
} from "@/lib/watchlist";
import { checkWatches, createWatch, removeWatch, updateWatch } from "@/services/watches";
import type { Watch, WatchCheckResult } from "@/types/watch";

const TONE: Record<StatusTone, string> = {
  fired: "border-warning/30 bg-warning/10 text-warning",
  quiet: "border-success/30 bg-success/10 text-success",
  paused: "border-border bg-muted text-muted-foreground",
  pending: "border-border bg-muted text-muted-foreground",
};
const DOT: Record<StatusTone, string> = {
  fired: "bg-warning",
  quiet: "bg-success",
  paused: "bg-muted-foreground",
  pending: "bg-muted-foreground",
};

type Dialog = { mode: "create" } | { mode: "edit"; watch: Watch } | null;

/**
 * Settings → Watching (SPEC-262): every "tell me when…" rule, where its figure
 * stands against the line, who is told, and when it last fired. Rows come from
 * one `/watches` read; every write invalidates it (and the nudge, which a firing
 * changes on every page).
 */
export function WatchingView() {
  const query = useApiQuery(watchQueries.list());
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmDelete, setConfirmDelete] = useState<Watch | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<WatchCheckResult | { error: string } | null>(null);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["watches"] }),
      queryClient.invalidateQueries({ queryKey: ["nudge"] }),
    ]);
  }

  async function submit(value: WatchFormValue) {
    const threshold = Number(value.threshold);
    if (dialog?.mode === "edit") {
      await updateWatch(dialog.watch.id, {
        direction: value.direction,
        threshold,
        period: value.period || null,
        notifyNudge: value.notifyNudge,
        notifyEmail: value.notifyEmail || null,
      });
    } else {
      await createWatch({
        metric: value.metric,
        direction: value.direction,
        threshold,
        productQuery: value.productQuery.trim() || null,
        period: value.period || null,
        notifyNudge: value.notifyNudge,
        notifyEmail: value.notifyEmail || null,
      });
    }
    await refresh();
  }

  async function toggle(watch: Watch) {
    await updateWatch(watch.id, { status: watch.status === "paused" ? "watching" : "paused" });
    await refresh();
  }

  async function remove(watch: Watch) {
    await removeWatch(watch.id);
    await refresh();
  }

  async function check() {
    setChecking(true);
    setCheckResult(null);
    try {
      setCheckResult(await checkWatches());
      await refresh();
    } catch (failure) {
      setCheckResult({ error: failure instanceof Error ? failure.message : "Checking failed." });
    } finally {
      setChecking(false);
    }
  }

  if (query.isPending) return <ListSkeleton />;
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const { watches, metrics, recipients } = query.data;
  const lastChecked = watches
    .map((w) => w.lastCheckedAt)
    .filter((v): v is string => v !== null)
    .sort()
    .at(-1);
  const active = watches.filter((w) => w.status === "watching").length;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card data-watching>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4 text-ai" aria-hidden />
              Watching
            </CardTitle>
            <CardDescription>
              {watches.length === 0
                ? "Ask the analyst to watch a figure, or add a rule here."
                : `${active} of ${watches.length} rule${watches.length === 1 ? "" : "s"} active · checked every sync${
                    lastChecked ? ` · last check ${relative(lastChecked)}` : ""
                  }`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void check()} disabled={checking || watches.length === 0} data-watch-check>
              {checking ? <LoaderCircle className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              {checking ? "Checking…" : "Check now"}
            </Button>
            <Button size="sm" onClick={() => setDialog({ mode: "create" })} data-watch-new>
              <Plus aria-hidden />
              New watch
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {checkResult && (
            <p className="text-xs text-muted-foreground" role="status" data-watch-check-result>
              {"error" in checkResult
                ? <span className="text-destructive">{checkResult.error}</span>
                : `Checked ${checkResult.checked} rule${checkResult.checked === 1 ? "" : "s"} in ${(checkResult.elapsedMs / 1000).toFixed(1)} s — ${
                    checkResult.fired.length === 0 ? "nothing crossed its line." : `${checkResult.fired.length} fired.`
                  }`}
            </p>
          )}
          {watches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center" data-watch-empty>
              <Eye className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Nothing watched yet</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Say it to the analyst — “tell me when returns on Linen Shirt pass 20%” — or add a rule. Some to start with:
              </p>
              <ul className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-1.5">
                {EXAMPLES.map((example) => (
                  <li key={example} className="rounded-md border bg-background px-2 py-1 text-xs">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Now</TableHead>
                    <TableHead>Tell</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watches.map((watch) => (
                    <WatchRow
                      key={watch.id}
                      watch={watch}
                      onEdit={() => setDialog({ mode: "edit", watch })}
                      onToggle={() => void toggle(watch)}
                      onDelete={() => setConfirmDelete(watch)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Every rule sits on a figure the platform already computes — the same numbers on Returns, Inventory and the Dashboard. A watch adds a line to cross and someone to tell; it never adds a number.
          </p>
        </CardContent>
      </Card>

      <WatchDialog
        key={dialog ? (dialog.mode === "edit" ? `edit-${dialog.watch.id}` : "create") : "closed"}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        metrics={metrics}
        recipients={recipients}
        initial={dialog?.mode === "edit" ? dialog.watch : undefined}
        onSubmit={submit}
      />

      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop watching?</AlertDialogTitle>
            <AlertDialogDescription>“{confirmDelete?.rule}” — the rule goes; nothing else changes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) void remove(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WatchRow({
  watch,
  onEdit,
  onToggle,
  onDelete,
}: {
  watch: Watch;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const status = statusLabel(watch);
  const bar = meter(watch.direction, watch.lastValue, watch.threshold);
  const paused = watch.status === "paused";
  return (
    <TableRow data-watch-row={watch.id} data-state={watch.state} className={cn(paused && "opacity-60")}>
      <TableCell className="min-w-56 align-top">
        <div className="text-sm font-semibold">{watch.rule.replace(/ \(.*\)$/, "")}</div>
        <div className="text-xs text-muted-foreground">
          {watch.period ? PERIOD_LABELS[watch.period] ?? watch.period : "Right now"}
          {watch.state === "fired" && watch.firedNote && (
            <span className="block text-foreground/80">{watch.firedNote}</span>
          )}
          {watch.emailError && <span className="block text-warning">Email: {watch.emailError}</span>}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <span className={cn("text-sm font-semibold", bar?.over && "text-warning")} data-watch-now>
          {watch.current}
        </span>
        {bar && (
          <span className="relative mt-1.5 block h-1.5 w-28 rounded-full bg-muted" aria-hidden>
            <span
              className={cn("absolute inset-y-0 left-0 rounded-full", bar.over ? "bg-warning" : "bg-success")}
              style={{ width: `${Math.round(bar.fill * 100)}%` }}
            />
            <span className="absolute -top-0.5 h-2.5 w-0.5 bg-foreground" style={{ left: `${Math.round(bar.line * 100)}%` }} />
          </span>
        )}
        <Link href={watch.href} className="mt-1 block text-[11px] text-muted-foreground underline-offset-2 hover:underline">
          Open the page
        </Link>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex flex-wrap gap-1">
          {tellLabels(watch).map((label) => (
            <span key={label} className="rounded-md border bg-background px-1.5 py-0.5 text-[11px]">
              {label}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <span
          className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONE[status.tone])}
          data-watch-status={status.tone}
        >
          <span className={cn("size-1.5 rounded-full", DOT[status.tone])} aria-hidden />
          {status.label}
        </span>
        {watch.fireCount > 1 && (
          <span className="mt-1 block text-[11px] text-muted-foreground">fired {watch.fireCount} times</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${watch.rule}`}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              data-watch-menu
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>
              {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
              {paused ? "Resume" : "Pause"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
