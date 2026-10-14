"use client";

import { useMemo, useState } from "react";
import { History, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { teamQueries } from "@/lib/queries/team";
import { auditSentence, type AuditNames } from "@/lib/team";
import { formatDate, formatTime } from "@/utils/format";

/**
 * Settings → Organization → Audit log (SPEC-316, moved to its own tab by SPEC-324): who changed
 * access, roles, billing and settings, newest first, in plain sentences. Pages on the backend's
 * `next_before` cursor; each page is its own cached read. Names come from the members and roles
 * reads when the viewer may see them; otherwise a sentence says "someone".
 */
export function AuditTab() {
  const members = useApiQuery(teamQueries.members());
  const roles = useApiQuery(teamQueries.roles());
  const first = useApiQuery(teamQueries.audit(null));
  const [cursors, setCursors] = useState<(number | null)[]>([null]);

  const names = useMemo<AuditNames>(() => {
    const people = new Map((members.data ?? []).map((m) => [m.userId, m.name]));
    const roleNames = new Map((roles.data ?? []).map((r) => [r.key, r.name]));
    return {
      member: (id) => people.get(id) ?? null,
      role: (key) => roleNames.get(key) ?? null,
    };
  }, [members.data, roles.data]);

  return (
    <SettingsPanel
      title="Activity"
      icon={History}
      description="Invitations, role changes, removals and organization settings — who did what, and when."
      action={
        first.isFetching && !first.isPending ? (
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-label="Refreshing" />
        ) : null
      }
    >
      <ul>
        {cursors.map((cursor, index) => (
          <AuditPage
            key={cursor ?? "first"}
            before={cursor}
            names={names}
            isLast={index === cursors.length - 1}
            onMore={(next) => setCursors((list) => [...list, next])}
          />
        ))}
      </ul>
    </SettingsPanel>
  );
}

function AuditPage({
  before,
  names,
  isLast,
  onMore,
}: {
  before: number | null;
  names: AuditNames;
  isLast: boolean;
  onMore: (cursor: number) => void;
}) {
  const query = useApiQuery(teamQueries.audit(before));

  if (query.isPending) {
    return (
      <>
        {Array.from({ length: before === null ? 8 : 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 border-t border-border px-5 py-3.5 first:border-t-0 sm:px-6" aria-hidden>
            <Skeleton className="h-3.5 w-28 shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
          </li>
        ))}
      </>
    );
  }
  if (query.isError) {
    return (
      <li className="border-t border-border px-5 py-4 text-sm text-muted-foreground first:border-t-0 sm:px-6">
        The activity could not be read.{" "}
        <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => void query.refetch()}>
          Try again
        </button>
      </li>
    );
  }

  const { events, nextBefore } = query.data;
  if (before === null && events.length === 0) {
    return <li className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nothing has changed yet.</li>;
  }
  return (
    <>
      {events.map((event) => (
        <li
          key={event.id}
          className="grid grid-cols-1 gap-1 border-t border-border px-5 py-3.5 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6 sm:px-6"
        >
          <time dateTime={event.createdAt} className="text-sm text-muted-foreground tabular-nums">
            {formatDate(event.createdAt)} · {formatTime(event.createdAt)}
          </time>
          <span className="text-sm">{auditSentence(event, names)}</span>
        </li>
      ))}
      {isLast && nextBefore !== null ? (
        <li className="border-t border-border px-5 py-3 sm:px-6">
          <Button variant="outline" size="sm" onClick={() => onMore(nextBefore)}>
            Show older
          </Button>
        </li>
      ) : null}
    </>
  );
}
