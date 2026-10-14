import { Skeleton } from "@/components/ui/skeleton";

/** Store League content-only skeleton (SPEC-112) — a ranked table. */
export default function StoreLeagueLoading() {
  return <Skeleton className="h-96 rounded-2xl" />;
}
