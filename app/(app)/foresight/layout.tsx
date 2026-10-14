import { ForesightShell } from "@/features/foresight/foresight-shell";

/**
 * Persistent layout for the Foresight tabs (SPEC-152 / V4). Not unmounted across
 * tab switches, so the header + tab bar stay painted — only the tab content swaps,
 * showing its own content-only skeleton.
 */
export default function ForesightLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ForesightShell>{children}</ForesightShell>;
}
