"use client";

import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CiTabs } from "@/features/ci/ci-tabs";
import { ciTabFor } from "@/lib/ci";

/**
 * Persistent shell for Continuous Innovation (SPEC-253 → SPEC-272, the SPEC-232
 * pattern): the feed and the plans list share the header and the Reports | Plans
 * bar; a report (`/ci/<id>`) or a plan (`/ci/plans/<id>`) owns its own title and
 * renders bare.
 */
export function CiShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = ciTabFor(pathname);
  if (!tab) return <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>;
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Continuous Innovation"
        description="Every build report since day one, and every plan waiting for your decision — what you asked for, what was built, what comes next."
      />
      <div>
        <CiTabs active={tab} />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
