import { describe, expect, it } from "vitest";

import {
  SETTINGS_GROUPS,
  SETTINGS_TABS,
  canSeeTab,
  firstVisibleTab,
  tabForPath,
  visibleGroups,
} from "@/lib/settings-nav";

/** The built-in roles' effective settings permissions (backend `access/templates.py`). */
const OWNER = ["*"];
const ADMIN = ["audit.view", "billing.view", "roles.manage", "settings.manage", "settings.view", "team.manage", "team.view"];
const MANAGER = ["team.view", "orders.view", "brief.manage"];
const SOCIAL = ["social.publish", "social.view", "spotlight.publish", "chat.use"];
const VIEWER = ["dashboard.view"];

const keys = (permissions: string[]) => visibleGroups(permissions).flatMap((g) => g.tabs.map((t) => t.key));

describe("settings navigation", () => {
  it("has three groups in order, every tab a unique route", () => {
    expect(SETTINGS_GROUPS.map((g) => g.key)).toEqual(["store", "organization", "account"]);
    const hrefs = SETTINGS_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((h) => h === "/settings" || h.startsWith("/settings/"))).toBe(true);
  });

  it("keeps every existing settings URL", () => {
    for (const href of [
      "/settings",
      "/settings/daily-report",
      "/settings/automatic-sending",
      "/settings/manager-notifications",
      "/settings/watching",
      "/settings/team",
      "/settings/roles",
      "/settings/branding",
    ]) {
      expect(tabForPath(href).href).toBe(href);
    }
  });

  it("maps a path to its tab — query strings, trailing slashes and unknown children", () => {
    expect(tabForPath("/settings").key).toBe("store-general");
    expect(tabForPath("/settings/").key).toBe("store-general");
    expect(tabForPath("/settings/manager-notifications?focus=location-12&return=%2Fbrief").key).toBe(
      "manager-notifications",
    );
    expect(tabForPath("/settings/billing?session_id=cs_1").key).toBe("billing");
    expect(tabForPath("/settings/team/anything").key).toBe("team");
    expect(tabForPath("/settings/nope").key).toBe("store-general");
  });

  it("shows the owner everything", () => {
    expect(keys(OWNER)).toEqual(SETTINGS_TABS.map((t) => t.key));
  });

  it("shows an admin everything but what billing.manage alone would add", () => {
    expect(keys(ADMIN)).toEqual(SETTINGS_TABS.map((t) => t.key));
  });

  it("shows a manager the team, watching and their own account", () => {
    expect(keys(MANAGER)).toEqual(["watching", "team", "roles", "profile", "sidebar", "security"]);
  });

  it("shows a social media manager only watching and their own account", () => {
    expect(keys(SOCIAL)).toEqual(["watching", "profile", "sidebar", "security"]);
    expect(visibleGroups(SOCIAL).map((g) => g.key)).toEqual(["store", "account"]);
  });

  it("never leaves a member without a tab", () => {
    for (const permissions of [OWNER, ADMIN, MANAGER, SOCIAL, VIEWER, []]) {
      expect(keys(permissions)).toContain("profile");
      expect(canSeeTab(firstVisibleTab(permissions), permissions)).toBe(true);
    }
    expect(firstVisibleTab(OWNER).key).toBe("store-general");
    expect(firstVisibleTab(SOCIAL).key).toBe("watching");
  });

  it("lets any one of a tab's permissions open it", () => {
    const billing = SETTINGS_TABS.find((t) => t.key === "billing")!;
    expect(canSeeTab(billing, ["billing.view"])).toBe(true);
    expect(canSeeTab(billing, ["team.view"])).toBe(false);
  });
});
