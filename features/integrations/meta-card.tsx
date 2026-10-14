"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import {
  connectionSummary,
  metaBadge,
  metaCapability,
  tokenWarning,
} from "@/lib/meta-connection";
import { disconnectMeta, getMetaAuthorizeUrl } from "@/services/meta-actions";
import type { MetaStatus } from "@/types/integrations";

const TONE_CLASS: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * Meta (Instagram + Facebook) connect card — backend SPEC-179.
 *
 * Deliberately the same shape as `GoogleSearchConsoleCard`: two integrations
 * that behave identically should read identically, and that one is proven.
 *
 * The one difference that matters: Meta has a **fourth** state Google doesn't —
 * a Facebook Page connected with no linked Instagram Business account. That is
 * the line between "publishing works" and "half of publishing works", so it
 * shows as "Facebook only" with the fix, never a green Connected badge over a
 * half-working integration. All of that ordering lives in `lib/meta-connection.ts`
 * where Vitest can hold it still.
 */
export function MetaCard({ status }: { status: MetaStatus }) {
  const router = useRouter();
  const can = useCan();
  const gate = can("integrations.manage");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const badge = metaBadge(status);
  const capability = metaCapability(status);
  const warning = tokenWarning(status);
  const rows = connectionSummary(status);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      window.location.href = await getMetaAuthorizeUrl();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start the Meta connection.",
      );
      setConnecting(false);
    }
  }

  async function handleDisconnect(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectMeta();
      setDialogOpen(false);
      setDisconnecting(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect. Try again.");
      setDisconnecting(false);
    }
  }

  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Instagram &amp; Facebook</p>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Social publishing
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
        Connects the Facebook Page and its linked Instagram Business account so
        approved posts can publish from here, on schedule.
      </p>

      {status.connected ? (
        <div className="space-y-3">
          <dl className="space-y-1 text-xs text-muted-foreground">
            {rows.map((row) => (
              <div key={row.label} className="flex gap-1.5">
                <dt className="font-medium text-foreground">{row.label}</dt>
                <dd className="min-w-0 truncate">{row.value}</dd>
              </div>
            ))}
          </dl>

          {capability && (
            <p
              className={
                status.instagramLinked
                  ? "text-xs text-muted-foreground"
                  : "text-xs text-warning"
              }
            >
              {capability}
            </p>
          )}

          {warning && (
            <p
              role="alert"
              className="inline-flex items-start gap-1.5 text-xs text-warning"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <AlertDialog
            open={dialogOpen}
            onOpenChange={(next) => {
              if (disconnecting) return;
              setDialogOpen(next);
              if (!next) setError(null);
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!gate.allowed}
                title={gate.reason ?? undefined}
              >
                <Trash2 className="size-3.5" aria-hidden />
                  Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Instagram &amp; Facebook?</AlertDialogTitle>
                <AlertDialogDescription>
                  Scheduled posts will stop publishing and no new performance data
                  will arrive until you reconnect. Your drafts and calendar are
                  untouched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : status.configured ? (
        <div className="space-y-2">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <RoleButton need="integrations.manage" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <ExternalLink className="size-4" aria-hidden />
                Connect Instagram &amp; Facebook
              </>
            )}
          </RoleButton>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Not available — Meta isn&apos;t configured on the server yet.
        </p>
      )}
    </Card>
  );
}
