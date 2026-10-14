import { PlansSkeleton } from "@/features/ci/plans-skeleton";

/** Content-only skeleton — the shell's header and tab bar stay painted. */
export default function Loading() {
  return <PlansSkeleton />;
}
