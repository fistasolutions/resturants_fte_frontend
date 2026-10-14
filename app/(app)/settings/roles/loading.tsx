import { RolesSkeleton } from "@/features/settings/settings-skeletons";

/** Roles's content-only skeleton (SPEC-324) — the header and tab bar stay painted in the
 * persistent shell; this fills only the tab body while its data loads. */
export default function Loading() {
  return <RolesSkeleton />;
}
