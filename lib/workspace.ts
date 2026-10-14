/**
 * The workspace (backend SPEC-319) as the app layout needs it (SPEC-317) — pure. One
 * `/workspace` read carries the navigation, the organization's branding, its features and
 * calendar, and the store's currency and timezone; every part is optional so an older backend
 * (or a blip) degrades to the platform defaults rather than an error.
 */
import { toBrandColor } from "@/lib/brand-color";
import type { HiddenReason, NavVisibility, WorkspaceNavigation } from "@/lib/disclosure";
import { toVisibility, type ApiVisibility, type Visibility } from "@/lib/guided-view";
import { viaProxy, type PublicBranding } from "@/lib/login-media";

export interface ApiWorkspace {
  organization?: { name?: string; features?: string[]; calendar_system?: string | null };
  store?: { currency?: string | null; iana_timezone?: string | null } | null;
  branding?: Partial<PublicBranding> | null;
  navigation?: NavVisibility[];
  /** Backend SPEC-366: the guided view's answer (SPEC-357). */
  visibility?: ApiVisibility | null;
  /** SPEC-319: each system and whether it is connected. */
  integrations?: Record<string, { connected?: boolean } | undefined>;
}

export interface WorkspaceBrand {
  /** The organization's name, or null when unknown (the platform name is shown). */
  name: string | null;
  logoLight: string | null;
  logoDark: string | null;
  /** The brand colour as `#rrggbb` (SPEC-322), or null for the platform's own. */
  color: string | null;
}

export interface Workspace {
  /** What the sidebar and the access gate follow: `navigation` with the guided view's pages
   * laid over it (SPEC-357). */
  navigation: WorkspaceNavigation;
  /** The guided view (SPEC-357); null when the backend sent none, which hides nothing. */
  visibility: Visibility | null;
  /** SPEC-360: the systems connected now (`shopify`, `google`, `loop`, …). */
  connected: string[];
  brand: WorkspaceBrand;
  features: string[];
  calendarSystem: string | null;
  currency: string | null;
  timezone: string | null;
  /** SPEC-342: the backend says this company has no store yet — the app sends it to
   * onboarding. Only an explicit `store: null` counts; a failed read never does. */
  needsStore: boolean;
}

export const EMPTY_WORKSPACE: Workspace = {
  navigation: null,
  visibility: null,
  connected: [],
  brand: { name: null, logoLight: null, logoDark: null, color: null },
  features: [],
  calendarSystem: null,
  currency: null,
  timezone: null,
  needsStore: false,
};

/**
 * `navigation` with each page's guided answer laid over it: `visible`, `reason` and `needs` come
 * from `visibility.pages`, `ready` stays. A page the guided view does not name keeps its own
 * values, and a full organization's pages mirror navigation, so nothing changes for it.
 */
export function guidedNavigation(
  navigation: NavVisibility[] | null,
  visibility: Visibility | null,
): WorkspaceNavigation {
  if (navigation === null || visibility === null) return navigation;
  return navigation.map((item) => {
    const page = visibility.pages[item.key];
    if (!page) return item;
    return {
      ...item,
      visible: page.visible,
      reason: (page.reason as HiddenReason | null) ?? null,
      needs: page.needs,
    };
  });
}

export function toWorkspace(api: ApiWorkspace | null | undefined): Workspace {
  if (!api) return EMPTY_WORKSPACE;
  const logo = api.branding?.logo;
  const visibility = toVisibility(api.visibility);
  return {
    navigation: guidedNavigation(Array.isArray(api.navigation) ? api.navigation : null, visibility),
    visibility,
    connected: Object.entries(api.integrations ?? {})
      .filter(([, value]) => value?.connected === true)
      .map(([key]) => key),
    brand: {
      name: api.organization?.name || api.branding?.name || null,
      logoLight: viaProxy(logo?.light?.url),
      logoDark: viaProxy(logo?.dark?.url),
      color: toBrandColor(api.branding?.color)?.hex ?? null,
    },
    features: Array.isArray(api.organization?.features) ? api.organization.features : [],
    calendarSystem: api.organization?.calendar_system ?? null,
    currency: api.store?.currency ?? null,
    timezone: api.store?.iana_timezone ?? null,
    needsStore: api.store === null,
  };
}
