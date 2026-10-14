/** The organization's own settings (SPEC-324 over backend SPEC-331): name, login link, calendar. */
import {
  toOrganizationSettings,
  type ApiOrganizationSettings,
  type OrganizationSettings,
} from "@/lib/account-settings";
import { defineQuery } from "@/lib/query-def";

export const organizationPaths = {
  settings: (): string => "/organizations/current/settings",
} as const;

export const organizationQueries = {
  settings: () =>
    defineQuery<OrganizationSettings>(["organization", "settings"], async (api) =>
      toOrganizationSettings(await api<ApiOrganizationSettings>(organizationPaths.settings())),
    ),
} as const;
