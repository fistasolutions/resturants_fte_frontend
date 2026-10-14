/**
 * View as company (SPEC-363): the support session a token belongs to, from `/auth/me`. Read only
 * by the banner, and only when the marker cookie says this tab is a support session — every other
 * user never makes this request.
 */
import { defineQuery } from "@/lib/query-def";
import { adaptSupportSession, type ApiSupportSession, type SupportSession } from "@/lib/support-session";

export const supportSessionPaths = {
  me: (): string => "/auth/me",
} as const;

export const supportSessionQueries = {
  current: () =>
    defineQuery<SupportSession | null>(["support-session", "current"], async (api) =>
      adaptSupportSession(
        (await api<{ support_session?: ApiSupportSession | null }>(supportSessionPaths.me()))
          .support_session,
      ),
    ),
} as const;
