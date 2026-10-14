import { DeskSkeleton } from "@/features/report-fte/skeletons";

/** Content-only skeleton for the Desk tab (SPEC-256) — the shell stays painted. */
export default function Loading() {
  return <DeskSkeleton />;
}
