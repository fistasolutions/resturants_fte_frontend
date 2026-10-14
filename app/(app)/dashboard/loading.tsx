import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton";

/** Content-only fallback (SPEC-232): the greeting header is painted by the layout
 * shell. The same skeleton the client view shows while its first fetch streams in
 * (SPEC-230), so the two never differ. */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
