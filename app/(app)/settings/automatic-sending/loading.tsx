import { AutomaticSendingSkeleton } from "@/features/settings/settings-skeletons";

/** Automatic sending's content-only skeleton (SPEC-324) — the header and tab bar stay painted in the
 * persistent shell; this fills only the tab body while its data loads. */
export default function Loading() {
  return <AutomaticSendingSkeleton />;
}
