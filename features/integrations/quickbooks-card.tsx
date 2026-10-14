"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ExternalLink, LoaderCircle, Trash2 } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
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
import { Card } from "@/components/ui/card";
import { DisconnectAllDialog } from "@/features/finance/disconnect-dialogs";
import { QboSyncBar } from "@/features/integrations/qbo-sync-bar";
import { useQboConnections } from "@/features/integrations/use-qbo-connections";
import { FINANCE_ROOT } from "@/lib/finance";
import { rateLabel, reportingLine, waitingForRates } from "@/lib/finance-currency";
import type { Permission } from "@/lib/permissions";
import { FINANCE_KEY } from "@/lib/queries/finance";
import {
  connectLabel,
  connectNotice,
  connectionRows,
  QUICKBOOKS_INTEGRATION_PATH,
  quickBooksBadge,
  quickBooksCapability,
  returnCookie,
} from "@/lib/quickbooks-connection";
import { cn } from "@/lib/utils";
import {
  disconnectAllQuickBooks,
  disconnectQuickBooks,
  quickBooksAuthorizeUrl,
} from "@/services/finance-actions";
import type { ConnectionsOverview } from "@/types/finance";

const TONE_CLASS: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

/** Connecting or disconnecting a company is Finance's connection and an integration (SPEC-358). */
const CONNECTION_NEED: readonly Permission[] = ["finance.manage", "integrations.manage"];

const OFFLINE: ConnectionsOverview = {
  connections: [],
  connected: 0,
  ready: false,
  configured: false,
  syncing: false,
  reportingCurrency: "",
  rates: [],
};

/**
 * QuickBooks Online connect card (SPEC-300) — deliberately the same shape as `MetaCard`
 * and `GoogleSearchConsoleCard`, because three integrations that behave alike should read
 * alike and those two are proven.
 *
 * The one difference that matters: **this is a list, not a connection.** Each company is a
 * separate set of books, so the card names each one and its badge
 * reports the worst state among them — a company that has stopped updating must never
 * hide behind a green badge. That ordering lives in `lib/quickbooks-connection.ts` where
 * Vitest can hold it still.
 */
export function QuickBooksCard() {
  const queryClient = useQueryClient();
  const query = useQboConnections();
  const notice = connectNotice(new URLSearchParams(useSearchParams().toString()));
  const [connecting, setConnecting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  // A hiccup reading the connections renders the "not connected" card, never a blank
  // panel — the same best-effort contract Google and Meta have on this page.
  const overview = query.data ?? OFFLINE;
  const badge = quickBooksBadge(overview);
  const capability = quickBooksCapability(overview);
  const rows = connectionRows(overview);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      // Intuit's callback brings the owner back here, not to Finance Oversight (SPEC-303).
      document.cookie = returnCookie(QUICKBOOKS_INTEGRATION_PATH);
      window.location.href = await quickBooksAuthorizeUrl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the QuickBooks connection.");
      setConnecting(false);
    }
  }

  // SPEC-331 — every company at once, behind the typed confirmation.
  async function handleDisconnectAll(): Promise<boolean> {
    setError(null);
    try {
      await disconnectAllQuickBooks();
      await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect the companies. Try again.");
      return false;
    }
  }

  async function handleDisconnect(connectionId: number) {
    setRemoving(true);
    setError(null);
    try {
      await disconnectQuickBooks(connectionId);
      await queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect. Try again.");
    }
    setRemoving(false);
  }

  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">QuickBooks Online</p>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Accounts payable
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASS[badge.tone]}`}
        >
          {badge.tone === "success" && <Check className="size-3" aria-hidden />}
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Reads the unpaid bills from each company&apos;s books, so Accounts Payable can show
        what all of them owe in one place. Each company connects once.
      </p>

      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs",
            notice.tone === "success" && "bg-success/10 text-success",
            notice.tone === "error" && "bg-destructive/10 text-destructive",
            notice.tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          {notice.text}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="divide-y rounded-lg border text-xs text-muted-foreground">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-x-1.5 gap-y-2 px-3 py-2.5">
              {row.sync ? (
                // While its read runs, the company's line IS its progress bar (SPEC-303).
                <dd className="min-w-0 flex-1">
                  <QboSyncBar company={row.company} view={row.sync} />
                </dd>
              ) : (
                <>
                  <dt className="font-medium text-foreground">{row.company}</dt>
                  <dd className="min-w-0 flex-1 truncate">
                    <span className="tabular-nums">{row.realm}</span>
                    {" · "}
                    <span className={cn(row.broken && "text-warning")}>{row.detail}</span>
                  </dd>
                </>
              )}
              <RoleButton
                need={CONNECTION_NEED}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirm({ id: row.id, name: row.company })}
                aria-label={`Disconnect ${row.company}`}
                className="ml-auto h-7 shrink-0 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Disconnect
              </RoleButton>
            </div>
          ))}
        </dl>
      )}

      {rows.length > 0 && reportingLine(overview) && (
        // SPEC-331 — what every Finance figure is in, and each rate behind it.
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{reportingLine(overview)}</span>
          {overview.rates.map((rate) => (
            <span key={`${rate.currency}-${rate.source}`}> · {rateLabel(rate, overview.reportingCurrency)}</span>
          ))}
          {waitingForRates(overview).map((row) => (
            <span key={row.company} className="block text-warning">
              <AlertTriangle className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              {row.company} uses {row.currencies.join(", ")} with no rate — set it on Accounts Payable.
            </span>
          ))}
        </p>
      )}

      {capability && (
        <p
          className={cn(
            "text-xs",
            rows.some((row) => row.broken) ? "text-warning" : "text-muted-foreground",
          )}
        >
          {rows.some((row) => row.broken) && (
            <AlertTriangle className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
          )}
          {capability}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {overview.configured ? (
        <div className="flex flex-wrap items-center gap-2">
          <RoleButton need={CONNECTION_NEED} size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <ExternalLink className="size-4" aria-hidden />
                {connectLabel(overview)}
              </>
            )}
          </RoleButton>
          {rows.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={FINANCE_ROOT}>Open Accounts Payable</Link>
            </Button>
          )}
          {rows.length >= 2 && (
            <RoleButton
              need={CONNECTION_NEED}
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmAll(true)}
            >
              Disconnect all
            </RoleButton>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Not available — QuickBooks isn&apos;t configured on the server yet.
        </p>
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (removing) return;
          if (!next) {
            setConfirm(null);
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {confirm?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Its bills, payments, bank balances and Finance findings are removed from here, the
              access is revoked at Intuit, and the &ldquo;Before Finance&rdquo; baseline is rebuilt
              from the companies still connected.{" "}
              <b>Nothing in QuickBooks changes</b> — it stays the system of record. You can
              connect the company again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                if (confirm) void handleDisconnect(confirm.id);
              }}
              disabled={removing}
            >
              {removing ? "Disconnecting…" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DisconnectAllDialog
        open={confirmAll}
        companies={rows.map((row) => row.company)}
        onClose={() => setConfirmAll(false)}
        onConfirm={handleDisconnectAll}
      />
    </Card>
  );
}
