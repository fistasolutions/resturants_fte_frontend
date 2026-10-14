"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { SpotlightTabs } from "@/features/spotlight/spotlight-tabs";
import { isBrandBrainDetailPath } from "@/lib/brand-brain";
import { normalizeSpotlightTab } from "@/lib/spotlight";

/**
 * Persistent Spotlight shell (SPEC-109), rendered from the spotlight
 * `layout.tsx` so the header + tab bar stay mounted across tab switches — only
 * `{children}` (the active tab, behind a keyed `<Suspense>`) re-renders and
 * shows its own content-only skeleton. Mirrors the Returns shell exactly.
 */
export function SpotlightShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Brand Brain lives at `/spotlight/brand-brain/*` (SPEC-263) and keeps this header +
  // tab bar; the draft routes own their own header and pass through bare.
  // A Knowledge Base item or a fact (SPEC-274) is a page of its own with a breadcrumb.
  const isBrandBrain = pathname.startsWith("/spotlight/brand-brain") && !isBrandBrainDetailPath(pathname);
  if (pathname !== "/spotlight" && !isBrandBrain) return <>{children}</>;

  const active = isBrandBrain ? "brand-brain" : normalizeSpotlightTab(searchParams.get("tab"));

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current="Search Visibility" />
        <PageHeader
          title="Search Visibility"
          description="Your AI brand-visibility engine: a cited Brand Brain, an inbound SEO content pipeline, human approvals, and the organic reach it earns."
        />
      </div>
      <div>
        <SpotlightTabs active={active} />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
