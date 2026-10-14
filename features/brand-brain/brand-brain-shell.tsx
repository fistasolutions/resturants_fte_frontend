"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import { BRAND_BRAIN_SECTIONS, brandBrainHref, brandBrainSectionLabel, isBrandBrainDetailPath, isBrandBrainSection } from "@/lib/brand-brain";

/**
 * The persistent Brand Brain sub-tab bar (SPEC-263), rendered from the brand-brain
 * `layout.tsx` inside the Spotlight shell. Static by construction — the strip carries no
 * data (SPEC-232: a shell never fetches), so a sub-tab switch re-renders `{children}` and
 * nothing above it. Since SPEC-297 it is the tabs alone: the Spotlight header is the
 * page's one title.
 */
export function BrandBrainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // A document or a fact page (SPEC-274) owns its breadcrumb; the strip steps aside.
  if (isBrandBrainDetailPath(pathname)) return <>{children}</>;
  const segment = pathname.split("/")[3];
  const active = isBrandBrainSection(segment) ? segment : "coverage";

  return (
    <section data-brand-brain-shell>
      {/* SPEC-297: no second title. The Spotlight header above already names the page;
          repeating "Brand Brain" and its description pushed every tab below the fold. */}
      <FolderTabBar role="tablist" label="Brand Brain sections" className="folder-nested">
        {BRAND_BRAIN_SECTIONS.map((section) => {
          const selected = section === active;
          return (
            <Link
              key={section}
              href={brandBrainHref(section)}
              role="tab"
              aria-selected={selected}
              {...folderTab(selected)}
            >
              {brandBrainSectionLabel(section)}
            </Link>
          );
        })}
      </FolderTabBar>
      <FolderPanel className="folder-panel-nested">{children}</FolderPanel>
    </section>
  );
}
