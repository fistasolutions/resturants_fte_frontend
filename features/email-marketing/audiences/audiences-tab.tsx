"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Lock, RefreshCw, Search } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { clampPage, pageCount, paginate } from "@/lib/catalog-pagination";
import { accessGate } from "@/lib/email-access";
import { filterByName } from "@/lib/email-marketing";
import { providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { relativeTime } from "@/lib/system-trace";
import { PRODUCT } from "@/lib/product";
import { syncAudience } from "@/services/email-marketing-actions";
import type { Audience, EmailProviderKey } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

const PROVIDER_PAGE_SIZE = 20;

/** The email platform's own lists and segments (SPEC-345 patch) — often many (Klaviyo can hold
 * dozens), so searched by name and paged twenty at a time, all over the already-loaded list: a
 * search or page change redraws only this section, never the tab. */
function ProviderAudiences({ rows, provider }: { rows: Audience[]; provider: EmailProviderKey }) {
  const name = providerInfo(provider).name;
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState({ q: "", page: 1 });
  const shown = useMemo(() => filterByName(rows, query), [rows, query]);
  const pages = pageCount(shown.length, PROVIDER_PAGE_SIZE);
  const page = pageState.q === query.trim().toLowerCase() ? pageState.page : 1;
  const current = clampPage(page, shown.length, PROVIDER_PAGE_SIZE);
  const visible = useMemo(() => paginate(shown, current, PROVIDER_PAGE_SIZE), [shown, current]);
  const goTo = (next: number) =>
    setPageState({ q: query.trim().toLowerCase(), page: clampPage(next, shown.length, PROVIDER_PAGE_SIZE) });

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{name} lists and segments</h2>
        {rows.length > PROVIDER_PAGE_SIZE ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${name} lists…`} aria-label={`Search ${name} lists and segments`} className="h-8 w-44 pl-8 text-sm sm:w-56" />
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lists or segments were read from {name}.</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No lists or segments match your search.</p>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {visible.map((a) => (
              <Row key={a.key} a={a} provider={provider} busy onSync={() => undefined} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              {pages > 1 ? `Page ${current} of ${pages} · ` : ""}
              {shown.length} {shown.length === 1 ? "list" : "lists and segments"}
            </p>
            {pages > 1 ? (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => goTo(current - 1)} disabled={current <= 1} aria-label="Previous page" className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40">
                  <ChevronLeft className="size-4" /> Prev
                </button>
                <button type="button" onClick={() => goTo(current + 1)} disabled={current >= pages} aria-label="Next page" className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40">
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

function ConsentBar({ a }: { a: Audience }) {
  const total = Math.max(1, a.size);
  const parts = [
    { label: "Email subscribed", value: a.consent.emailSubscribed, className: "bg-success" },
    { label: "Never subscribed", value: a.consent.neverSubscribed, className: "bg-muted-foreground/30" },
    { label: "Suppressed", value: a.consent.suppressed, className: "bg-destructive/60" },
  ];
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {parts.map((p) => (
          <span key={p.label} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {formatNumber(a.consent.emailSubscribed)} email · {formatNumber(a.consent.smsSubscribed)} SMS · {formatNumber(a.consent.neverSubscribed)} never subscribed · {formatNumber(a.consent.suppressed)} suppressed
      </p>
    </div>
  );
}

function Row({ a, provider, busy, onSync }: { a: Audience; provider: EmailProviderKey; busy: boolean; onSync: () => void }) {
  const name = providerInfo(provider).name;
  return (
    <li className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_14rem_auto] md:items-center">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {a.name}
          {a.protective ? <StatusBadge tone="info">Protected</StatusBadge> : null}
          <span className="text-xs font-normal tabular-nums text-muted-foreground">{formatNumber(a.size)} profiles</span>
        </p>
        <p className="text-xs text-muted-foreground">{a.description}</p>
        <ConsentBar a={a} />
      </div>
      <div className="text-xs text-muted-foreground">
        {a.source === "fte" ? (
          <>
            <p>{a.overlap !== null ? `${formatNumber(a.overlap)} already in ${name}` : "Not compared yet"}</p>
            <p className="flex items-center gap-1">
              <ArrowLeftRight className="size-3" aria-hidden />
              {a.sync.at ? `Synced to ${name} as a ${a.sync.as} ${relativeTime(a.sync.at)}` : `Never synced to ${name}`}
            </p>
          </>
        ) : (
          <p className="flex items-center gap-1">
            <ArrowLeftRight className="size-3" aria-hidden />
            Read from {name} {relativeTime(a.sync.at)}
          </p>
        )}
      </div>
      <div className="flex gap-2 md:justify-end">
        {a.source === "fte" ? (
          <RoleButton need="email_marketing.manage" size="sm" variant="outline" disabled={busy} onClick={onSync}>
            <RefreshCw aria-hidden />
            Sync to {name}
          </RoleButton>
        ) : null}
      </div>
    </li>
  );
}

/** Audiences (SPEC-345): the platform's own segments — built from orders, margin, the repeat
 * clock and returns — next to the email platform's own, each with its consent. Consent is
 * read from the platform and can never be changed here. */
export function AudiencesTab() {
  const audiences = useApiQuery(emailMarketingQueries.audiences());
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  const actions = useEmailMarketingActions();
  const can = useCan();
  if (audiences.isPending || workspace.isPending) return <ListSkeleton rows={8} />;
  if (audiences.isError) return <QueryErrorState error={audiences.error} onRetry={() => void audiences.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  const provider = workspace.data.connection.provider;
  const fte = audiences.data.filter((a) => a.source === "fte");
  const theirs = audiences.data.filter((a) => a.source !== "fte");
  const name = providerInfo(provider).name;
  const sync = (key: string) => void actions.run(`sync-${key}`, () => syncAudience(key));
  // The role's reason first, then the key's (SPEC-358 rule 4).
  const roleSync = can("email_marketing.manage");
  const syncGate = roleSync.allowed ? accessGate(workspace.data.access, "audiences") : roleSync;
  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        Consent comes from {name} and is never changed here. Syncing a segment mirrors its consented members onto a {name} list — adding and removing profiles — and never subscribes anyone.
      </p>
      {actions.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{PRODUCT.short} segments</h2>
        {!syncGate.allowed ? <p className="text-sm text-muted-foreground">{syncGate.reason}</p> : null}
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {fte.map((a) => (
            <Row key={a.key} a={a} provider={provider} busy={actions.busy !== null || !syncGate.allowed} onSync={() => sync(a.key)} />
          ))}
        </ul>
      </section>
      <ProviderAudiences rows={theirs} provider={provider} />
    </div>
  );
}
