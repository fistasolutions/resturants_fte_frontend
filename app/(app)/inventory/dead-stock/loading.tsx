import { Skeleton } from "@/components/ui/skeleton";

/** Dead Stock skeleton (SPEC-100): the aged-stock table + markdown-plan CTA.
 * Content-only — chrome is in the shell. */
export default function InventoryDeadStockLoading() {
  return (
    <>
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
    </>
  );
}
