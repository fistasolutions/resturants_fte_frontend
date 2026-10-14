import { ResultsShell } from "@/features/results/results-shell";

/** Persistent header for Results (SPEC-232) — see the shell. */
export default function ResultsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ResultsShell>{children}</ResultsShell>;
}
