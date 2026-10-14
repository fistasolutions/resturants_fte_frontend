import { Skeleton } from "@/components/ui/skeleton";

/** Transfers-tab skeleton (SPEC-100): the transfer plan summary + the transfer
 * table + the store-to-store card. Content-only — chrome is in the shell. */
export default function InventoryTransfersLoading() {
  return (
    <>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
    </>
  );
}
