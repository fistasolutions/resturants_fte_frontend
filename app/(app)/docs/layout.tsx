import { DocsShell } from "@/features/docs/docs-shell";

/** Persistent header + two-tier tabs for every `/docs` route (SPEC-229). */
export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DocsShell>{children}</DocsShell>;
}
