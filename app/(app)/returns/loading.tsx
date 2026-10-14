import { ReturnsContentSkeleton } from "@/features/returns/returns-content-skeleton";

/** Route-level fallback for the first navigation into `/returns`. Tab and
 * date-range switches (searchParam changes) are handled by the in-page keyed
 * `<Suspense>` instead — see page.tsx. */
export default function ReturnsLoading() {
  return <ReturnsContentSkeleton />;
}
