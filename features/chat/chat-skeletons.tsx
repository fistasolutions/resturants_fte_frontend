import { Skeleton } from "@/components/ui/skeleton";
import { CHAT_COLUMN_CLASS } from "@/lib/chat-layout";
import { cn } from "@/lib/utils";

/**
 * The chat's data while it is on its way (SPEC-354) — one skeleton for every chat surface:
 * Chat with AI, the Ask Glisp panel and every digital employee's chat. It stands where the
 * thread will be, in the thread's own shape (a question on the right, an answer card on the
 * left), so the frame around it never moves when the data lands. Pulse only, no entrance.
 */
export function ThreadSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading the conversation"
      className={cn(CHAT_COLUMN_CLASS, "flex flex-col", compact ? "gap-3 p-4" : "gap-4")}
    >
      {[0, 1].map((turn) => (
        <div key={turn} className="flex flex-col gap-4">
          <Skeleton className={cn("ml-auto h-12 rounded-2xl", turn === 0 ? "w-2/5" : "w-1/3")} />
          <div className="flex gap-3">
            {compact ? null : <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1 overflow-hidden rounded-card border border-border">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="space-y-2 px-4 py-3">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                {turn === 0 ? <Skeleton className="mt-3 h-24 w-full rounded-xl" /> : null}
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading the conversation…</span>
    </div>
  );
}

/** A chat rail's thread list while it loads (SPEC-354). */
export function RailSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading your chats" className="space-y-1.5 px-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5 rounded-lg px-2 py-2">
          <Skeleton className={cn("h-3.5", i % 2 === 0 ? "w-4/5" : "w-3/5")} />
          <Skeleton className="h-2.5 w-12" />
        </div>
      ))}
    </div>
  );
}
