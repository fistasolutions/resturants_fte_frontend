import { SocialContentSkeleton } from "@/features/social/social-content-skeleton";

/** Route-level fallback for the first navigation into `/social`. Tab switches
 * (searchParam changes) are handled by the in-page keyed `<Suspense>` instead
 * — see page.tsx. */
export default function SocialLoading() {
  return <SocialContentSkeleton />;
}
