import type { Metadata } from "next";

import { GorgiasShell } from "@/features/team-performance/gorgias-shell";

export const metadata: Metadata = {
  title: "Team Performance",
};

/**
 * Persistent shell for the Gorgias workspace tabs (SPEC-094). A layout is not
 * unmounted when navigating between its child routes, so the header + date
 * picker + tab bar (in `GorgiasShell`) stay painted across tab switches — only
 * the tab body swaps. Detail routes render bare (the shell self-gates).
 */
export default function TeamPerformanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <GorgiasShell>{children}</GorgiasShell>;
}
