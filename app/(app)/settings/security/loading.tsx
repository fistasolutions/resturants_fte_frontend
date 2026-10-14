import { SecuritySkeleton } from "@/features/settings/settings-skeletons";

/** Security's content-only skeleton (SPEC-324) — the header and tab bar stay painted in the
 * persistent shell; this fills only the tab body while its data loads. */
export default function Loading() {
  return <SecuritySkeleton />;
}
