import { Skeleton } from "@/components/ui/skeleton";

/** Size Intelligence content skeleton (SPEC-153) — shell paints header + tabs. */
export default function ForesightSizesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 rounded-card" />
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}
