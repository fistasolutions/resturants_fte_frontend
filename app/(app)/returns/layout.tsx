import { ReturnsShell } from "@/features/returns/returns-shell";

/**
 * Persistent layout for the Returns Intelligence tabs (SPEC-095). A layout is
 * not unmounted when navigating between child routes / tab searchParams, so the
 * header + tab bar (in `ReturnsShell`) stay painted across tab switches — only
 * the content below swaps, showing its own content-only skeleton.
 */
export default function ReturnsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ReturnsShell>{children}</ReturnsShell>;
}
