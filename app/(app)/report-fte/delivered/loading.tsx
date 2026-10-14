import { DeliveredSkeleton } from "@/features/report-fte/skeletons";

/** Content-only skeleton for the Delivered & scheduled tab (SPEC-256) — the shell stays painted. */
export default function Loading() {
  return <DeliveredSkeleton />;
}
