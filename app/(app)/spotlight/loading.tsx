import { SpotlightContentSkeleton } from "@/features/spotlight/spotlight-content-skeleton";

/** Route-level fallback for the first navigation into `/spotlight`. Tab
 * switches (searchParam changes) are handled by the in-page keyed `<Suspense>`
 * instead — see page.tsx. */
export default function SpotlightLoading() {
  return <SpotlightContentSkeleton />;
}
