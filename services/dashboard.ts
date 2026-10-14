/**
 * Dashboard data service — server transport (SPEC-017, SPEC-037). Since SPEC-230 the
 * paths, keys and the aggregate + "what changed" composition live in
 * `lib/queries/dashboard.ts` so the client cache can refetch the same definitions
 * through `/api/proxy`; this module is the `serverApi` face of them.
 */
import { serverApi } from "@/lib/api";
import {
  dashboardQueries,
  loadWhatChanged,
  type DashboardQuery,
} from "@/lib/queries/dashboard";
import type { ReturnsSpikeItem } from "@/types/analytics";
import type {
  DashboardData,
  DashboardMoney,
  LocationKpisData,
  WhatChanged,
} from "@/types/dashboard";

export type { DashboardQuery } from "@/lib/queries/dashboard";

export async function getDashboardData(query: DashboardQuery): Promise<DashboardData> {
  return dashboardQueries.data(query).load(serverApi);
}

export async function getLocationKpis(from: string, to: string): Promise<LocationKpisData> {
  return dashboardQueries.locations(from, to).load(serverApi);
}

/** What changed, and why (backend SPEC-214 / frontend SPEC-190); null on failure. */
export async function getWhatChanged(query: DashboardQuery): Promise<WhatChanged | null> {
  return loadWhatChanged(serverApi, query);
}

/** Server-side fetch for the returns-spike top-styles subpage (SPEC-070,
 * backend SPEC-054) — null on failure so the page can show a retry card. */
export async function getReturnsSpikeTop(limit = 25): Promise<ReturnsSpikeItem[] | null> {
  return dashboardQueries.returnsSpikeTop(limit).load(serverApi);
}

export async function getDashboardMoney(): Promise<DashboardMoney> {
  return dashboardQueries.money().load(serverApi);
}
