import { Skeleton } from "@/components/ui/skeleton";

/** Reorder-tab skeleton (SPEC-100): the reorder-alerts table + the
 * selling-but-out-of-stock table. Content-only — chrome is in the shell. */
export default function InventoryReorderLoading() {
  return (
    <>
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </>
  );
}
