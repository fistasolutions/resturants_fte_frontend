"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FilePen, Globe, PenLine, RefreshCw, Undo2 } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { LocalPageDialog } from "@/features/spotlight/local-page-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { missingCount, PAGE_STATE_LABELS, pageState } from "@/lib/local-pages";
import { spotlightQueries } from "@/lib/queries/spotlight";
import {
  publishLocalPage,
  unpublishLocalPage,
  writeLocalPage,
  writeMissingLocalPages,
} from "@/services/local-pages-actions";
import type { LocalPageBranch, LocalPagesData } from "@/types/local-pages";
import { formatDateTime } from "@/utils/format";

const LOCAL_PAGES_KEY = ["spotlight", "local-pages"] as const;

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Local pages (SPEC-386 over backend SPEC-403): one page per branch on the brand's own site. */
export function LocalPagesTab() {
  const queryClient = useQueryClient();
  const pages = useApiQuery(spotlightQueries.localPages());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<LocalPageBranch | null>(null);

  const apply = (data: LocalPagesData) => queryClient.setQueryData([...LOCAL_PAGES_KEY], data);
  const act = async (key: string, run: () => Promise<LocalPagesData>, done?: (d: LocalPagesData) => string) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const data = await run();
      apply(data);
      if (done) setNotice(done(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  };

  if (pages.isError) return <QueryErrorState error={pages.error} onRetry={() => void pages.refetch()} />;
  if (!pages.data) return <RestaurantSkeleton tiles={3} />;
  const data = pages.data;
  const missing = missingCount(data.branches);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Branches" value={data.counts.branches} />
        <Tile label="Pages written" value={data.counts.written} />
        <Tile label="Published" value={data.counts.published} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <RoleButton
          need={["spotlight.manage"]}
          disabled={busy !== null || missing === 0}
          onClick={() =>
            void act("missing", writeMissingLocalPages, (d) => `Wrote ${d.writtenNow ?? 0} page${d.writtenNow === 1 ? "" : "s"} as drafts.`)
          }
        >
          <FilePen aria-hidden /> {busy === "missing" ? "Writing…" : `Write the missing pages (${missing})`}
        </RoleButton>
        <a
          href={data.sitePath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <Globe className="size-4" aria-hidden /> Your locations site <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      <FormError message={error} />
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

      {data.branches.length === 0 ? (
        <EmptyPanel title="No branches yet" body="Add your branches under Network; each gets a page here." />
      ) : (
        <Panel title="Branch pages" count={String(data.branches.length)}>
          <ul className="divide-y divide-border">
            {data.branches.map((row) => {
              const state = pageState(row);
              const key = String(row.branchId);
              return (
                <li key={row.branchId} className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        #{row.code} {row.name}
                      </span>
                      {row.city ? <span className="text-sm text-muted-foreground">{row.city}</span> : null}
                      <Badge variant={state === "published" ? "default" : state === "draft" ? "secondary" : "outline"}>
                        {PAGE_STATE_LABELS[state]}
                      </Badge>
                      {row.page && !row.page.writtenByModel ? (
                        <Badge variant="outline" title="The writer was unavailable; this page was written from the branch's facts.">
                          Plain
                        </Badge>
                      ) : null}
                    </div>
                    {row.page ? (
                      <>
                        <p className="text-sm text-foreground">{row.page.headline}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{row.page.seoDescription}</p>
                        {row.page.updatedAt ? (
                          <p className="text-xs text-muted-foreground">Updated {formatDateTime(row.page.updatedAt)}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No page yet.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleButton
                      need={["spotlight.manage"]}
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => void act(`write-${key}`, () => writeLocalPage(row.branchId))}
                    >
                      <RefreshCw aria-hidden /> {busy === `write-${key}` ? "Writing…" : row.page ? "Rewrite" : "Write"}
                    </RoleButton>
                    {row.page ? (
                      <RoleButton need={["spotlight.manage"]} size="sm" variant="outline" disabled={busy !== null} onClick={() => setEditing(row)}>
                        <PenLine aria-hidden /> Edit
                      </RoleButton>
                    ) : null}
                    {row.page && state === "draft" ? (
                      <RoleButton
                        need={["spotlight.publish"]}
                        size="sm"
                        disabled={busy !== null || row.branchStatus !== "open"}
                        title={row.branchStatus !== "open" ? "Only an open branch's page can be published." : undefined}
                        onClick={() => void act(`publish-${key}`, () => publishLocalPage(row.branchId))}
                      >
                        <Globe aria-hidden /> Publish
                      </RoleButton>
                    ) : null}
                    {state === "published" ? (
                      <>
                        <RoleButton
                          need={["spotlight.publish"]}
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() => void act(`unpublish-${key}`, () => unpublishLocalPage(row.branchId))}
                        >
                          <Undo2 aria-hidden /> Unpublish
                        </RoleButton>
                        {row.publicPath ? (
                          <a
                            href={row.publicPath}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            View <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
      {editing?.page ? (
        <LocalPageDialog
          key={editing.branchId}
          branchId={editing.branchId}
          branchName={editing.name}
          page={editing.page}
          open
          onOpenChange={(open) => (open ? null : setEditing(null))}
          onSaved={apply}
        />
      ) : null}
    </div>
  );
}
