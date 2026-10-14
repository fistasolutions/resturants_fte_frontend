import { PageSkeleton } from "@/components/shared/page-skeleton";

/** Content-only fallback (SPEC-232): the header is already painted by the layout
 * shell, so this must never draw a second one. Before this file existed the route
 * had no fallback at all and sat blank until the report list arrived. */
export default function TaxReportsLoading() {
  return <PageSkeleton blocks={3} />;
}
