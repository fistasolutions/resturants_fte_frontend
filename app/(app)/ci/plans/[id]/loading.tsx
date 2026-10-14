import { PlanReaderSkeleton } from "@/features/ci/plans-skeleton";

/** Content-only skeleton for a plan — the reader owns its own title, so this is the paper. */
export default function Loading() {
  return <PlanReaderSkeleton />;
}
