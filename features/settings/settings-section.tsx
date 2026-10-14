"use client";

import { SettingsShell } from "@/features/settings/settings-shell";
import { TabBadge } from "@/features/settings/settings-tabs";
import { useApiQuery } from "@/hooks/use-api-query";
import { storeQueries } from "@/lib/queries/store";
import { teamQueries } from "@/lib/queries/team";

/**
 * The Settings shell fed from the client cache (SPEC-230, SPEC-324). The layout prefetches the
 * member's access (`/auth/me`) and the one `/settings/status` answer the store tabs share. The
 * access decides which tabs are drawn; the status only feeds two badges, so until it lands (or
 * for a member without `settings.view`, who never gets it) the badges are simply absent.
 */
export function SettingsSection({ children }: { children: React.ReactNode }) {
  const access = useApiQuery(teamQueries.access());
  const overview = useApiQuery(storeQueries.settingsOverview());
  const managers = overview.data?.locationManagers ?? [];
  const configured = managers.filter((l) => l.managerEmail).length;
  const autoSend = overview.data?.briefAutoSend.enabled;

  // A failed access read must not lock anyone out of their own account: fall back to the
  // tabs every member has, and let the backend decide the rest.
  const permissions = access.data?.permissions ?? (access.isError ? [] : null);

  return (
    <SettingsShell
      permissions={permissions}
      badges={{
        "automatic-sending":
          autoSend === undefined ? undefined : (
            <TabBadge tone={autoSend ? "success" : "muted"}>{autoSend ? "On" : "Off"}</TabBadge>
          ),
        "manager-notifications":
          managers.length > 0 ? (
            <TabBadge tone={configured < managers.length ? "warning" : "muted"}>
              {configured}/{managers.length}
            </TabBadge>
          ) : undefined,
      }}
    >
      {children}
    </SettingsShell>
  );
}
