import { ReportFteShell } from "@/features/report-fte/report-fte-shell";

/**
 * Persistent shell for the Report FTE tabs (SPEC-256). A layout is not unmounted
 * when navigating between its child routes, so the header + tab bar (rendered
 * inside `ReportFteShell`) stay painted across tab switches — only the page content
 * below swaps, showing its own content-only skeleton while its data loads.
 */
export default function ReportFteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ReportFteShell>{children}</ReportFteShell>;
}
