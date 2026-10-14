/** Your own account (SPEC-324 over backend SPEC-331): where you are signed in. */
import { toSessions, type ApiSession, type SessionView } from "@/lib/account-settings";
import { defineQuery } from "@/lib/query-def";

export const accountPaths = {
  sessions: (): string => "/auth/sessions",
} as const;

export const accountQueries = {
  sessions: () =>
    defineQuery<SessionView[]>(["account", "sessions"], async (api) =>
      toSessions((await api<{ sessions: ApiSession[] }>(accountPaths.sessions())).sessions),
    ),
} as const;
