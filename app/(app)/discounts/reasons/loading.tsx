import { Skeleton } from "@/components/ui/skeleton";

/** Reasons breakdown skeleton (SPEC-136) — the no-reason banner + a ranked list. */
export default function DiscountsReasonsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 rounded-md" />
        ))}
      </div>
    </div>
  );
}
