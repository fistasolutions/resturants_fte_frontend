import { TabSkeleton } from "@/features/email-marketing/skeletons";

/** Content-only skeleton (SPEC-232) — the shell's header and tabs stay painted. */
export default function Loading() {
  return <TabSkeleton />;
}
