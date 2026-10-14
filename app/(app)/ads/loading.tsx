import { AdsContentSkeleton } from "@/features/ads/ads-content-skeleton";

/** Route-level fallback for the first navigation into `/ads`. Tab switches
 * (searchParam changes) are handled by the in-page keyed `<Suspense>` instead
 * — see page.tsx. */
export default function AdsLoading() {
  return <AdsContentSkeleton />;
}
