/** The page nudge (SPEC-246): one read per page family, through the client cache. */
import { defineQuery } from "@/lib/query-def";
import type { Nudge, NudgeResponse } from "@/types/nudge";

export const nudgePaths = {
  forRoute: (route: string): string => `/nudge?route=${encodeURIComponent(route)}`,
} as const;

export const nudgeQueries = {
  forRoute: (route: string) =>
    defineQuery<Nudge | null>(["nudge", route], async (api) => {
      const body = await api<NudgeResponse>(nudgePaths.forRoute(route));
      return body.nudge;
    }),
} as const;
