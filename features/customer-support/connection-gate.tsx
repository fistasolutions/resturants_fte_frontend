"use client";

import { Clock, Plug, Timer } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { useSupportConnection } from "@/features/customer-support/use-support-connection";
import { useApiQuery } from "@/hooks/use-api-query";
import { isStale, supportHref } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { formatTime } from "@/utils/format";

/** Shown on every tab while no helpdesk is connected — one way forward. */
export function SupportNotConnected({ what }: { what: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground" aria-hidden>
        <Plug className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">Connect your helpdesk</h2>
      <p className="text-sm text-muted-foreground">
        {what} comes from your helpdesk. Connect Gorgias in Settings — it is the same connection as on Integrations,
        so if you connected it there, it shows here too.
      </p>
      <ShallowLink href={supportHref("settings", { section: "connection" })} className={buttonVariants()}>
        Go to Settings → Connection
      </ShallowLink>
    </div>
  );
}

/** The two honesty notes a tab carries above its content: old data, and a rate-limited intake. */
function FreshnessNotes({ lastSuccessAt }: { lastSuccessAt: string | null }) {
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const now = new Date();
  const stale = isStale(lastSuccessAt, now);
  const intake = workspace.data?.intake ?? null;
  const limited = intake?.rateLimitedAt && now.getTime() - new Date(intake.rateLimitedAt).getTime() < 3_600_000;
  if (!stale && !limited) return null;
  return (
    <div className="space-y-2">
      {stale ? (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {lastSuccessAt
            ? `Gorgias last synced at ${formatTime(lastSuccessAt)} — over two hours ago. New tickets may be missing until the next sync.`
            : "Gorgias has not synced yet. New tickets appear after the first sync."}
        </p>
      ) : null}
      {limited && intake ? (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Timer className="mt-0.5 size-4 shrink-0" aria-hidden />
          Gorgias asked us to slow down at {formatTime(intake.rateLimitedAt as string)}; new tickets arrived {intake.delayedSeconds} seconds
          late. Its limit is 40 requests every 20 seconds per API key.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Wraps every tab but Settings (SPEC-346): the tab's own skeleton while the connection is read,
 * the error state if it cannot be, the not-connected state when Gorgias is not connected, and
 * otherwise the freshness notes above the tab's content.
 */
export function ConnectionGate({ what, skeleton, children }: { what: string; skeleton: React.ReactNode; children: React.ReactNode }) {
  const connection = useSupportConnection();
  if (connection.state === "loading") return <>{skeleton}</>;
  if (connection.state === "error" && connection.error) {
    return <QueryErrorState error={connection.error} onRetry={connection.retry} />;
  }
  if (connection.state === "not_connected") return <SupportNotConnected what={what} />;
  return (
    <div className="space-y-4">
      <FreshnessNotes lastSuccessAt={connection.hub?.lastSuccessAt ?? null} />
      {children}
    </div>
  );
}
