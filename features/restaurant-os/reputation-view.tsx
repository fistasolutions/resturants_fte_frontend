"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PenLine, Send } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { TAG_LABELS, filterRatings, share, starsText, type RatingFilter } from "@/lib/reputation";
import { cn } from "@/lib/utils";
import { draftRatingReply, editRatingReply, sendRatingReply } from "@/services/restaurant-os-actions";
import type { GuestRating } from "@/types/restaurant-os";
import { formatDateTime } from "@/utils/format";

const DAYS = [7, 30, 90] as const;
const FILTERS: { key: RatingFilter; label: string }[] = [
  { key: "waiting", label: "Waiting for a reply" },
  { key: "low", label: "1–2 stars" },
  { key: "high", label: "4–5 stars" },
  { key: "all", label: "All" },
];

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function RatingCard({ rating, onChanged }: { rating: GuestRating; onChanged: () => Promise<void> }) {
  const [reply, setReply] = useState(rating.replyDraft ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sent = rating.replyStatus === "sent";

  const act = async (key: string, run: () => Promise<{ replyDraft: string | null; sentBy?: string }>) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const result = await run();
      if (result.replyDraft !== null) setReply(result.replyDraft);
      if (result.sentBy) setNotice(result.sentBy === "email" ? "Sent to the guest by email." : "Recorded as answered (the guest has no email).");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base tracking-wider text-foreground" aria-label={`${rating.stars} out of 5 stars`}>
          {starsText(rating.stars)}
        </span>
        <span className="text-sm font-medium text-foreground">{rating.guest ?? "A guest"}</span>
        <span className="text-xs text-muted-foreground">
          {rating.branch}
          {rating.orderNumber ? ` · order #${rating.orderNumber}` : ""}
          {rating.createdAt ? ` · ${formatDateTime(rating.createdAt)}` : ""}
        </span>
        {rating.needsReply ? <Badge variant="secondary">Waiting for a reply</Badge> : null}
        {sent ? <Badge variant="outline">Answered</Badge> : null}
      </div>
      {rating.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {rating.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {TAG_LABELS[tag]}
            </span>
          ))}
        </div>
      ) : null}
      {rating.comment ? <p className="text-sm text-foreground">“{rating.comment}”</p> : null}
      {sent ? (
        <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          {rating.replyText}
          {rating.repliedAt ? <span className="block pt-1 text-xs">Answered {formatDateTime(rating.repliedAt)}</span> : null}
        </p>
      ) : (
        <div className="space-y-2">
          <Textarea
            aria-label="Reply to the guest"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Draft a reply, or write your own."
          />
          <div className="flex flex-wrap gap-2">
            <RoleButton
              need={["network.manage"]}
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void act("draft", () => draftRatingReply(rating.id))}
            >
              <PenLine aria-hidden /> {busy === "draft" ? "Drafting…" : rating.replyDraft ? "Draft again" : "Draft a reply"}
            </RoleButton>
            <RoleButton
              need={["network.manage"]}
              size="sm"
              variant="outline"
              disabled={busy !== null || !reply.trim() || reply === (rating.replyDraft ?? "")}
              onClick={() => void act("save", () => editRatingReply(rating.id, reply))}
            >
              Save
            </RoleButton>
            <RoleButton
              need={["network.manage"]}
              size="sm"
              disabled={busy !== null || !reply.trim()}
              onClick={() => void act("send", () => sendRatingReply(rating.id, reply))}
            >
              <Send aria-hidden /> Send
            </RoleButton>
          </div>
        </div>
      )}
      <FormError message={error} />
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
    </li>
  );
}

/** The Reputation Manager (SPEC-390 over backend SPEC-408). */
export function ReputationView() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<number>(30);
  const [filter, setFilter] = useState<RatingFilter>("waiting");
  const data = useApiQuery(restaurantQueries.reputation(days, null, null));
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "reputation"] });

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <RestaurantSkeleton tiles={4} />;
  const page = data.data;
  const shown = filterRatings(page.ratings, filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Period">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => setDays(d)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              days === d ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
            )}
          >
            Last {d} days
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Average" value={page.summary.average === null ? "—" : `${page.summary.average.toFixed(1)} ★`} />
        <Tile label="Ratings" value={String(page.summary.count)} />
        <Tile label="4–5 stars" value={share(page.summary.happyShare)} />
        <Tile label="Waiting for a reply" value={String(page.needsReply)} />
      </div>

      {page.summary.count === 0 ? (
        <EmptyPanel
          title="No ratings yet"
          body="Guests are asked to rate their order on the order tracker once it reaches them. Their ratings, the themes and the replies appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="What guests say">
              <ul className="divide-y divide-border">
                {page.themes.map((t) => (
                  <li key={t.tag} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className={cn("flex-1", t.kind === "complaint" ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
                    <span className="tabular-nums text-muted-foreground">{t.count}</span>
                    <span className="w-12 text-right tabular-nums">{share(t.share)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="By branch" count={String(page.branches.length)}>
              <ul className="divide-y divide-border">
                {page.branches.map((b) => (
                  <li key={b.branchId} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                    <span className="flex-1 font-medium">{b.branch}</span>
                    <span className="tabular-nums">{b.average.toFixed(1)} ★</span>
                    <span className="tabular-nums text-muted-foreground">{b.count} ratings</span>
                    {b.topComplaint ? <span className="text-xs text-muted-foreground">Most said: {b.topComplaint}</span> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter ratings">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === f.key ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
                )}
              >
                {f.label} <span className="tabular-nums">{filterRatings(page.ratings, f.key).length}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <EmptyPanel title="Nothing here" body={filter === "waiting" ? "Every unhappy guest has an answer." : "No rating under this filter."} />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {shown.map((rating) => (
                <RatingCard key={`${rating.id}-${rating.replyStatus}`} rating={rating} onChanged={refresh} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
