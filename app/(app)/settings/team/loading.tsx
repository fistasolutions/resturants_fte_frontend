import { TeamSkeleton } from "@/features/settings/settings-skeletons";

/** Team's content-only skeleton (SPEC-324) — the header and tab bar stay painted in the
 * persistent shell; this fills only the tab body while its data loads. */
export default function Loading() {
  return <TeamSkeleton />;
}
