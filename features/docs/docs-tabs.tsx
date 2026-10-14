"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderPanel, FolderTabBar, folderTab } from "@/components/shared/folder-tabs";
import {
  DOC_AREAS,
  DOCS_ROOT,
  activeDocArea,
  activeDocSlug,
  docHref,
  docsForArea,
  getDocArea,
} from "@/lib/docs";
import { cn } from "@/lib/utils";

/**
 * The two-tier sub-tabs of `/docs` (SPEC-229): area tabs (the same underline bar
 * every workspace uses) and, beneath, one pill per feature in the active area.
 * Both tiers are real links, so deep links land on the right tier and the
 * active state moves instantly on click (`usePathname`).
 */
export function DocsTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const area = activeDocArea(pathname) ?? "start";
  const slug = activeDocSlug(pathname);
  const docs = docsForArea(area);
  const areaDef = getDocArea(area);

  return (
    <div>
      <FolderTabBar label="Documentation areas">
        {DOC_AREAS.map((tab) => {
          const isActive = tab.key === area;
          const first = docsForArea(tab.key)[0];
          const href = tab.key === "start" || !first ? DOCS_ROOT : docHref(first.slug);
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              {...folderTab(isActive)}
            >
              {tab.label}
            </Link>
          );
        })}
      </FolderTabBar>

      <FolderPanel>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label={`${areaDef.label} pages`} className="flex flex-wrap items-center gap-2">
            {area === "start" ? (
              <Link
                href={DOCS_ROOT}
                aria-current="page"
                className="rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
              >
                Overview
              </Link>
            ) : (
              docs.map((doc) => {
                const isActive = doc.slug === slug;
                return (
                  <Link
                    key={doc.slug}
                    href={docHref(doc.slug)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {doc.title}
                  </Link>
                );
              })
            )}
          </nav>
          <p className="text-xs text-muted-foreground">{areaDef.summary}</p>
        </div>
        {children}
      </FolderPanel>
    </div>
  );
}
