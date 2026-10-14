import { SocialShell } from "@/features/social/social-shell";

/**
 * Persistent layout for the Social Growth tabs (SPEC-110). A layout is not
 * unmounted when navigating between tab searchParams, so the header + tab bar
 * (in `SocialShell`) stay painted across tab switches — only the content below
 * swaps, showing its own content-only skeleton. Mirrors Spotlight / Returns.
 */
export default function SocialLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SocialShell>{children}</SocialShell>;
}
