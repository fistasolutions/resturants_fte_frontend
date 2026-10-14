import { Skeleton } from "@/components/ui/skeleton";

/** Lost-Sales content-only skeleton (SPEC-112) — hero money card + gap list. */
export default function LostSalesLoading() {
  return (
    <>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </>
  );
}
