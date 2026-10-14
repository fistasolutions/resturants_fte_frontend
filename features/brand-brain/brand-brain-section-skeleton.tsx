import { Skeleton } from "@/components/ui/skeleton";

/** Content-only skeleton for a Brand Brain sub-tab (SPEC-263). */
export function BrandBrainSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
