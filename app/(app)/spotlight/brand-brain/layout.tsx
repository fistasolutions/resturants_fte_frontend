import { BrandBrainShell } from "@/features/brand-brain/brand-brain-shell";

/**
 * Persistent shell for the Brand Brain sub-tabs (SPEC-263), nested inside the
 * Spotlight shell. Next never unmounts a layout when a child route changes, so the
 * Spotlight header + tabs AND this strip + sub-tab bar stay painted across a
 * sub-tab switch — only the section below streams in.
 */
export default function BrandBrainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <BrandBrainShell>{children}</BrandBrainShell>;
}
