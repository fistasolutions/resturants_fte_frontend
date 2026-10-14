"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import type { SendContext } from "@/lib/email-builder";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import type { EmailContent, EmailWorkspace } from "@/types/email-marketing";

export type SendContextState =
  | { status: "pending" }
  | { status: "error"; error: Error; retry: () => void }
  | { status: "ready"; ctx: SendContext; workspace: EmailWorkspace; content: EmailContent };

/** What every send is judged against (SPEC-345): the connection and kill switch, the
 * audiences, the catalog and brand rules, today's sends, the seed tests and the spam rate —
 * five reads from the cache, the same for the builder, approvals and a campaign's page. */
export function useSendContext(): SendContextState {
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  const audiences = useApiQuery(emailMarketingQueries.audiences());
  const content = useApiQuery(emailMarketingQueries.content());
  const seeds = useApiQuery(emailMarketingQueries.seedTests());
  const deliverability = useApiQuery(emailMarketingQueries.deliverability());
  const all = [workspace, audiences, content, seeds, deliverability];
  const failed = all.find((q) => q.isError);
  if (failed?.error) return { status: "error", error: failed.error, retry: () => all.forEach((q) => void q.refetch()) };
  if (!workspace.data || !audiences.data || !content.data || !seeds.data || !deliverability.data) return { status: "pending" };
  const weeks = deliverability.data.weeks;
  return {
    status: "ready",
    workspace: workspace.data,
    content: content.data,
    ctx: {
      connected: workspace.data.connection.status === "connected",
      killSwitch: workspace.data.killSwitch.active,
      audiences: audiences.data,
      catalog: content.data.catalog,
      bannedWords: content.data.voice.bannedWords,
      sentToday: workspace.data.sentToday,
      seedTested: seeds.data,
      spamRate: weeks.length > 0 ? weeks[weeks.length - 1].spamRate : 0,
    },
  };
}
