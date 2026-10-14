import { SpotlightShell } from "@/features/spotlight/spotlight-shell";

/**
 * Persistent layout for the Spotlight tabs (SPEC-109). A layout is not
 * unmounted when navigating between tab searchParams, so the header + tab bar
 * (in `SpotlightShell`) stay painted across tab switches — only the content
 * below swaps, showing its own content-only skeleton. Mirrors Returns.
 */
export default function SpotlightLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SpotlightShell>{children}</SpotlightShell>;
}
