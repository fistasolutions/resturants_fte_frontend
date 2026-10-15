"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, UtensilsCrossed } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { splitAudiences, syncNotice } from "@/lib/guest-audiences";
import { EMAIL_MARKETING_KEY, emailMarketingQueries } from "@/lib/queries/email-marketing";
import { relativeTime } from "@/lib/system-trace";
import { syncGuestAudience } from "@/services/email-marketing-actions";
import type { GuestAudience } from "@/types/guest-audiences";
import { formatNumber } from "@/utils/format";

function Row({
  a,
  busy,
  disabledReason,
  onSync,
}: {
  a: GuestAudience;
  busy: boolean;
  disabledReason: string | null;
  onSync: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{a.name}</p>
        <p className="text-xs text-muted-foreground">{a.description}</p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {formatNumber(a.size)} guests · {formatNumber(a.withEmail)} with email ·{" "}
          <span className="font-medium text-foreground">{formatNumber(a.reachable)} opted in</span>
          {a.syncedAt ? ` · on the Klaviyo list: ${formatNumber(a.syncedCount ?? 0)}, ${relativeTime(a.syncedAt)}` : ""}
        </p>
      </div>
      <RoleButton
        need={["email_marketing.manage"]}
        size="sm"
        variant="outline"
        disabled={busy || a.reachable === 0 || disabledReason !== null}
        title={disabledReason ?? (a.reachable === 0 ? "No guest in this audience has opted in with an email." : undefined)}
        onClick={onSync}
      >
        <RefreshCw aria-hidden /> {a.syncedAt ? "Sync again" : "Send to Klaviyo"}
      </RoleButton>
    </li>
  );
}

/** A restaurant brand's guest audiences (SPEC-388 over backend SPEC-405). */
export function GuestAudiences({ disabledReason }: { disabledReason: string | null }) {
  const queryClient = useQueryClient();
  const rows = useApiQuery(emailMarketingQueries.guestAudiences());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (rows.isPending) return <ListSkeleton rows={6} />;
  if (rows.isError) return <QueryErrorState error={rows.error} onRetry={() => void rows.refetch()} />;
  const { lifecycle, branches } = splitAudiences(rows.data);

  const sync = async (a: GuestAudience) => {
    setBusy(a.key);
    setError(null);
    setNotice(null);
    try {
      setNotice(syncNotice(a.name, await syncGuestAudience(a.key)));
      await queryClient.invalidateQueries({ queryKey: [...EMAIL_MARKETING_KEY, "guest-audiences"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The audience could not be sent.");
    } finally {
      setBusy(null);
    }
  };
  const list = (items: GuestAudience[]) => (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((a) => (
        <Row key={a.key} a={a} busy={busy !== null} disabledReason={disabledReason} onSync={() => void sync(a)} />
      ))}
    </ul>
  );

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UtensilsCrossed className="size-4" aria-hidden /> Guest audiences
        </h2>
        <p className="text-sm text-muted-foreground">
          Built from your own orders. Sending one gives each opted-in guest&apos;s Klaviyo profile its audiences, home branch
          and last order, and keeps a Klaviyo list of the guests already subscribed there. Nobody is subscribed here.
        </p>
        {disabledReason ? <p className="text-sm text-muted-foreground">{disabledReason}</p> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      {list(lifecycle)}
      {branches.length ? (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">By branch</h3>
          {list(branches)}
        </>
      ) : null}
    </section>
  );
}
