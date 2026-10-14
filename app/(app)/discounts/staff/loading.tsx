import { Skeleton } from "@/components/ui/skeleton";

/** Staff leaderboard skeleton (SPEC-136) — a summary bar + a table. */
export default function DiscountsStaffLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
