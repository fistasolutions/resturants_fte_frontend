import { Skeleton } from "@/components/ui/skeleton";

/** Needs-attention skeleton (SPEC-142) — summary bar + action cards. */
export default function DiscountsAttentionLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
