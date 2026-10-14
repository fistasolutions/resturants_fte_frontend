/**
 * Settings navigation (SPEC-324) — the three groups, their tabs, who sees each, and which tab a
 * path is. Pure: the shell draws from it, the tests pin it.
 *
 * A tab is shown when the member holds any of its permissions (the backend's `/auth/me` list is
 * already effective — `manage` implies `view`), or when it names none. Profile and Security name
 * none, so every member always has somewhere to land. Sidebar (SPEC-338) names none too.
 */

export type SettingsGroupKey = "store" | "organization" | "account";

export type SettingsTabKey =
  | "store-general"
  | "daily-report"
  | "automatic-sending"
  | "manager-notifications"
  | "watching"
  | "organization"
  | "team"
  | "roles"
  | "branding"
  | "billing"
  | "audit"
  | "profile"
  | "sidebar"
  | "security";

export interface SettingsTab {
  key: SettingsTabKey;
  group: SettingsGroupKey;
  label: string;
  href: string;
  /** The line under the page title while this tab is open. */
  description: string;
  /** Any one of these; empty = every member. */
  permissions: readonly string[];
}

export interface SettingsGroup {
  key: SettingsGroupKey;
  label: string;
  tabs: readonly SettingsTab[];
}

const OWNER = "*";

function tab(
  key: SettingsTabKey,
  group: SettingsGroupKey,
  label: string,
  href: string,
  description: string,
  permissions: readonly string[] = [],
): SettingsTab {
  return { key, group, label, href, description, permissions };
}

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  {
    key: "store",
    label: "Store",
    tabs: [
      tab("store-general", "store", "General", "/settings", "Your Shopify connection and how the platform is running.", ["settings.view"]),
      tab("daily-report", "store", "Daily report", "/settings/daily-report", "When the daily executive report is written.", ["settings.view"]),
      tab("automatic-sending", "store", "Automatic sending", "/settings/automatic-sending", "Emails that go out on a schedule without you pressing Send.", ["settings.view"]),
      tab("manager-notifications", "store", "Manager notifications", "/settings/manager-notifications", "Who receives each alert: one address per location, plus the warehouse, support and returns leads.", ["settings.view"]),
      tab("watching", "store", "Watching", "/settings/watching", "The figures you asked to be told about — checked on every sync."),
    ],
  },
  {
    key: "organization",
    label: "Organization",
    tabs: [
      tab("organization", "organization", "General", "/settings/organization", "Your organization's name, login link and calendar.", ["settings.view"]),
      tab("team", "organization", "Team", "/settings/team", "The people in your organization and their roles.", ["team.view"]),
      tab("roles", "organization", "Roles", "/settings/roles", "What each role can see and do — edit the built-in roles or build your own.", ["team.view"]),
      tab("branding", "organization", "Branding", "/settings/branding", "Your logo, colour and login screen.", ["settings.view"]),
      tab("billing", "organization", "Billing & plan", "/settings/billing", "Your plan, AI allowance, payment method and invoices.", ["billing.view"]),
      tab("audit", "organization", "Audit log", "/settings/audit", "Who changed access, roles and settings — and when.", ["audit.view"]),
    ],
  },
  {
    key: "account",
    label: "Account",
    tabs: [
      tab("profile", "account", "Profile", "/settings/profile", "How your name appears to your team."),
      // SPEC-338: a personal display choice, so every member has it.
      tab("sidebar", "account", "Sidebar", "/settings/sidebar", "Choose the pages and tabs your sidebar shows."),
      tab("security", "account", "Security", "/settings/security", "Your password and the devices you're signed in on."),
    ],
  },
];

export const SETTINGS_TABS: readonly SettingsTab[] = SETTINGS_GROUPS.flatMap((g) => g.tabs);

/** The tab a pathname belongs to — the longest matching route, `/settings` itself last. */
export function tabForPath(pathname: string): SettingsTab {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/settings";
  const exact = SETTINGS_TABS.find((t) => t.href === path);
  if (exact) return exact;
  const nested = SETTINGS_TABS.filter((t) => t.href !== "/settings" && path.startsWith(`${t.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return nested ?? SETTINGS_TABS[0];
}

export function canSeeTab(tab: SettingsTab, permissions: readonly string[]): boolean {
  if (tab.permissions.length === 0) return true;
  if (permissions.includes(OWNER)) return true;
  return tab.permissions.some((p) => permissions.includes(p));
}

/** The groups and tabs this member sees; a group with no visible tab is left out. */
export function visibleGroups(permissions: readonly string[]): SettingsGroup[] {
  return SETTINGS_GROUPS.map((group) => ({
    ...group,
    tabs: group.tabs.filter((t) => canSeeTab(t, permissions)),
  })).filter((group) => group.tabs.length > 0);
}

/** Where a member lands when the tab they asked for is not theirs — Store first, else Account. */
export function firstVisibleTab(permissions: readonly string[]): SettingsTab {
  return visibleGroups(permissions)[0]?.tabs[0] ?? SETTINGS_TABS.find((t) => t.key === "profile")!;
}
