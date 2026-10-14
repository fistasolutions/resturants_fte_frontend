import { Bot, CloudCog, UserRound } from "lucide-react";

import { relativeTime } from "@/lib/system-trace";
import type { ActivityActor, ActivityEntry } from "@/types/email-marketing";

const ACTOR_ICON: Record<ActivityActor, typeof Bot> = { owner: UserRound, employee: Bot, provider: CloudCog };

/** The Activity timeline (SPEC-345): who or what did it, when, and what changed in the email platform. */
export function ActivityList({ entries, now }: { entries: ActivityEntry[]; now: Date }) {
  if (entries.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing has happened yet.</p>;
  }
  return (
    <ol className="divide-y divide-border">
      {entries.map((entry) => {
        const Icon = ACTOR_ICON[entry.actor];
        return (
          <li key={entry.id} className="flex gap-3 px-4 py-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{entry.action}</p>
              <p className="text-xs text-muted-foreground">
                {entry.actorName} · <time dateTime={entry.at}>{relativeTime(entry.at, now)}</time>
                {entry.providerChange ? ` · In the email platform: ${entry.providerChange}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
