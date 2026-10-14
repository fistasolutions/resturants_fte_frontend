import { ReportsShell } from "@/features/reports/reports-shell";

/** Persistent header for Daily Reports (SPEC-232) — see the shell. */
export default function ReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ReportsShell>{children}</ReportsShell>;
}
